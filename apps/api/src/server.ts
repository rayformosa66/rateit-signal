/**
 * RateIt Admin API — merchant assessment CRUD + public lookup + reports.
 *
 * Public endpoints (no auth):
 *   POST /api/auth/login                    — issue JWT
 *   GET  /api/merchants/by-domain/:domain   — extension lookup by domain
 *   GET  /v1/lookup?domain=...              — public domain lookup
 *   POST /api/reports                       — submit a shopper report
 *
 * Protected endpoints (Bearer JWT required):
 *   GET  /api/merchants                     — list all merchants
 *   GET  /api/merchants/:id                 — single merchant + assessment
 *   POST /api/merchants                     — create merchant + assessment
 *   PUT  /api/merchants/:id                 — update merchant + assessment
 *   GET  /api/reports                       — list reports (admin)
 *   PUT  /api/reports/:id                   — update report status (admin)
 */

import http from 'http';
import path from 'path';
import bcrypt from 'bcryptjs';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from './generated/prisma/client';
import { computeVerdict } from '@rateit/verdict-engine';
import { signToken, getAuthUser } from './auth';
import type { MerchantLookupResponse, PillarRating } from '@rateit/shared-types';
import { METHODOLOGY_VERSION } from '@rateit/shared-types';

// ---------------------------------------------------------------------------
// Database client
// ---------------------------------------------------------------------------

const dbPath = path.resolve(__dirname, '../dev.db');
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const REVIEWER_PLACEHOLDER = 'reviewer@rateit.internal';

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: Buffer) => { data += chunk.toString(); });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function json(res: http.ServerResponse, statusCode: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(payload);
}

function preflight(res: http.ServerResponse): void {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end();
}

function unauthorized(res: http.ServerResponse): void {
  json(res, 401, { error: 'Unauthorized' });
}

// ---------------------------------------------------------------------------
// Auth routes
// ---------------------------------------------------------------------------

/** POST /api/auth/login */
async function login(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const raw = await readBody(req);
  let body: { email?: string; password?: string };
  try {
    body = JSON.parse(raw) as { email?: string; password?: string };
  } catch {
    json(res, 400, { error: 'Invalid JSON' });
    return;
  }

  const { email, password } = body;
  if (!email || !password) {
    json(res, 422, { error: 'email and password are required' });
    return;
  }

  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    json(res, 401, { error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    json(res, 401, { error: 'Invalid credentials' });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  json(res, 200, { token, email: user.email, role: user.role });
}

// ---------------------------------------------------------------------------
// Merchant route handlers
// ---------------------------------------------------------------------------

/** GET /api/merchants */
async function listMerchants(res: http.ServerResponse): Promise<void> {
  const merchants = await prisma.merchant.findMany({
    orderBy: { name: 'asc' },
    include: {
      assessments: { orderBy: { reviewedAt: 'desc' }, take: 1 },
    },
  });

  const result = merchants.map((m) => {
    const assessment = m.assessments[0] ?? null;
    return {
      id: m.id,
      name: m.name,
      domain: m.domain,
      category: m.category,
      currentVerdict: m.currentVerdict,
      lastReviewedAt: m.lastReviewedAt?.toISOString() ?? null,
      publicSummary: m.publicSummary,
      status: m.status,
      assessment: assessment ? serializeAssessment(assessment) : null,
    };
  });

  json(res, 200, result);
}

/** GET /api/merchants/by-domain/:domain — public */
async function getMerchantByDomain(res: http.ServerResponse, domain: string): Promise<void> {
  const merchant = await prisma.merchant.findFirst({
    where: { domain: { equals: domain.toLowerCase() } },
    include: { assessments: { orderBy: { reviewedAt: 'desc' }, take: 1 } },
  });

  if (!merchant) {
    json(res, 404, { error: 'Merchant not found' });
    return;
  }

  const assessment = merchant.assessments[0] ?? null;
  const response: MerchantLookupResponse = {
    domain: merchant.domain,
    name: merchant.name,
    verdict: merchant.currentVerdict as MerchantLookupResponse['verdict'],
    lastReviewedAt: merchant.lastReviewedAt?.toISOString() ?? null,
    pillarSnapshot: {
      transparency: (assessment?.transparencyRating ?? 'Unknown') as PillarRating,
      reliability: (assessment?.reliabilityRating ?? 'Unknown') as PillarRating,
      integrity: (assessment?.integrityRating ?? 'Unknown') as PillarRating,
      communication: (assessment?.communicationRating ?? 'Unknown') as PillarRating,
    },
    publicSummary: merchant.publicSummary ?? '',
    topReasons: assessment ? (JSON.parse(assessment.publicReasons) as string[]).slice(0, 3) : [],
    auditTrail: {
      reviewedAt: assessment?.reviewedAt.toISOString() ?? null,
      reviewerRole: assessment?.reviewerRole ?? null,
      triggerReason: assessment?.triggerReason ?? null,
    },
    methodologyVersion: METHODOLOGY_VERSION,
    flaggedForReview: assessment?.flaggedForReview ?? false,
  };
  json(res, 200, response);
}

/** GET /api/merchants/:id */
async function getMerchant(res: http.ServerResponse, id: string): Promise<void> {
  const merchant = await prisma.merchant.findUnique({
    where: { id },
    include: { assessments: { orderBy: { reviewedAt: 'desc' }, take: 1 } },
  });

  if (!merchant) {
    json(res, 404, { error: 'Merchant not found' });
    return;
  }

  const assessment = merchant.assessments[0] ?? null;
  json(res, 200, {
    id: merchant.id,
    name: merchant.name,
    domain: merchant.domain,
    category: merchant.category,
    currentVerdict: merchant.currentVerdict,
    lastReviewedAt: merchant.lastReviewedAt?.toISOString() ?? null,
    publicSummary: merchant.publicSummary,
    status: merchant.status,
    assessment: assessment ? serializeAssessment(assessment) : null,
  });
}

/** POST /api/merchants */
async function createMerchant(req: http.IncomingMessage, res: http.ServerResponse, reviewerRole: string): Promise<void> {
  const raw = await readBody(req);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    json(res, 400, { error: 'Invalid JSON' });
    return;
  }

  const { name, domain, category, status, lastReviewedAt, assessment } = body as {
    name: string;
    domain: string;
    category: string;
    status: string;
    lastReviewedAt?: string;
    assessment?: AssessmentInput;
  };

  if (!name || !domain || !category) {
    json(res, 422, { error: 'name, domain, and category are required' });
    return;
  }

  const hasConflict = assessment?.hasConflict ?? false;
  const verdict = assessment
    ? computeVerdict({ ...assessment, hasConflict })
    : 'Insufficient Data';

  const merchant = await prisma.merchant.create({
    data: {
      name,
      domain,
      category,
      status: status || 'active',
      lastReviewedAt: lastReviewedAt ? new Date(lastReviewedAt) : null,
      publicSummary: assessment?.publicSummary ?? '',
      currentVerdict: verdict,
    },
  });

  let savedAssessment = null;
  if (assessment) {
    savedAssessment = await prisma.assessment.create({
      data: {
        merchantId: merchant.id,
        transparencyRating: assessment.transparencyRating,
        reliabilityRating: assessment.reliabilityRating,
        integrityRating: assessment.integrityRating,
        communicationRating: assessment.communicationRating,
        redFlags: JSON.stringify(assessment.redFlags),
        internalRationale: assessment.internalRationale,
        publicSummary: assessment.publicSummary,
        publicReasons: JSON.stringify(assessment.publicReasons),
        reviewedBy: REVIEWER_PLACEHOLDER,
        reviewedAt: lastReviewedAt ? new Date(lastReviewedAt) : new Date(),
        reviewerRole,
        triggerReason: assessment.triggerReason ?? 'Proactive review',
        hasConflict,
        flaggedForReview: hasConflict,
      },
    });
  }

  json(res, 201, {
    id: merchant.id,
    name: merchant.name,
    domain: merchant.domain,
    category: merchant.category,
    currentVerdict: merchant.currentVerdict,
    lastReviewedAt: merchant.lastReviewedAt?.toISOString() ?? null,
    publicSummary: merchant.publicSummary,
    status: merchant.status,
    assessment: savedAssessment ? serializeAssessment(savedAssessment) : null,
  });
}

/** PUT /api/merchants/:id */
async function updateMerchant(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  id: string,
  reviewerRole: string,
): Promise<void> {
  const existing = await prisma.merchant.findUnique({ where: { id } });
  if (!existing) { json(res, 404, { error: 'Merchant not found' }); return; }

  const raw = await readBody(req);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    json(res, 400, { error: 'Invalid JSON' }); return;
  }

  const { name, domain, category, status, lastReviewedAt, assessment } = body as {
    name: string;
    domain: string;
    category: string;
    status: string;
    lastReviewedAt?: string;
    assessment?: AssessmentInput;
  };

  if (!name || !domain || !category) {
    json(res, 422, { error: 'name, domain, and category are required' }); return;
  }

  const hasConflict = assessment?.hasConflict ?? false;
  const verdict = assessment
    ? computeVerdict({ ...assessment, hasConflict })
    : existing.currentVerdict;

  const merchant = await prisma.merchant.update({
    where: { id },
    data: {
      name, domain, category,
      status: status || existing.status,
      lastReviewedAt: lastReviewedAt ? new Date(lastReviewedAt) : existing.lastReviewedAt,
      publicSummary: assessment?.publicSummary ?? existing.publicSummary,
      currentVerdict: verdict,
      updatedAt: new Date(),
    },
  });

  let savedAssessment = null;
  if (assessment) {
    savedAssessment = await prisma.assessment.create({
      data: {
        merchantId: merchant.id,
        transparencyRating: assessment.transparencyRating,
        reliabilityRating: assessment.reliabilityRating,
        integrityRating: assessment.integrityRating,
        communicationRating: assessment.communicationRating,
        redFlags: JSON.stringify(assessment.redFlags),
        internalRationale: assessment.internalRationale,
        publicSummary: assessment.publicSummary,
        publicReasons: JSON.stringify(assessment.publicReasons),
        reviewedBy: REVIEWER_PLACEHOLDER,
        reviewedAt: lastReviewedAt ? new Date(lastReviewedAt) : new Date(),
        reviewerRole,
        triggerReason: assessment.triggerReason ?? 'Proactive review',
        hasConflict,
        flaggedForReview: hasConflict,
      },
    });
  }

  const latestAssessment = savedAssessment ?? await prisma.assessment.findFirst({
    where: { merchantId: id },
    orderBy: { reviewedAt: 'desc' },
  });

  json(res, 200, {
    id: merchant.id,
    name: merchant.name,
    domain: merchant.domain,
    category: merchant.category,
    currentVerdict: merchant.currentVerdict,
    lastReviewedAt: merchant.lastReviewedAt?.toISOString() ?? null,
    publicSummary: merchant.publicSummary,
    status: merchant.status,
    assessment: latestAssessment ? serializeAssessment(latestAssessment) : null,
  });
}

// ---------------------------------------------------------------------------
// Report route handlers
// ---------------------------------------------------------------------------

/** POST /api/reports — public */
async function createReport(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const raw = await readBody(req);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    json(res, 400, { error: 'Invalid JSON' }); return;
  }

  const { domain, reportType, description } = body as {
    domain: string;
    reportType: string;
    description: string;
  };

  if (!domain || !reportType || !description) {
    json(res, 422, { error: 'domain, reportType, and description are required' }); return;
  }

  const merchant = await prisma.merchant.findFirst({ where: { domain } });

  const report = await prisma.userReport.create({
    data: {
      domain,
      reportType,
      description,
      merchantId: merchant?.id ?? null,
      status: 'new',
    },
  });

  json(res, 201, {
    id: report.id,
    domain: report.domain,
    reportType: report.reportType,
    description: report.description,
    status: report.status,
    createdAt: report.createdAt.toISOString(),
  });
}

/** GET /api/reports — protected */
async function listReports(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const rawUrl = req.url ?? '/';
  const parsedUrl = new URL(rawUrl, 'http://localhost');
  const statusFilter = parsedUrl.searchParams.get('status');

  const reports = await prisma.userReport.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { merchant: { select: { name: true } } },
  });

  json(res, 200, reports.map((r) => ({
    id: r.id,
    domain: r.domain,
    merchantName: r.merchant?.name ?? null,
    reportType: r.reportType,
    description: r.description,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  })));
}

/** PUT /api/reports/:id — protected */
async function updateReport(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  id: string,
): Promise<void> {
  const existing = await prisma.userReport.findUnique({ where: { id } });
  if (!existing) { json(res, 404, { error: 'Report not found' }); return; }

  const raw = await readBody(req);
  let body: { status?: string };
  try {
    body = JSON.parse(raw) as { status?: string };
  } catch {
    json(res, 400, { error: 'Invalid JSON' }); return;
  }

  const validStatuses = ['new', 'under_review', 'resolved'];
  if (!body.status || !validStatuses.includes(body.status)) {
    json(res, 422, { error: 'status must be one of: new, under_review, resolved' }); return;
  }

  const report = await prisma.userReport.update({
    where: { id },
    data: { status: body.status },
  });

  json(res, 200, {
    id: report.id,
    domain: report.domain,
    reportType: report.reportType,
    description: report.description,
    status: report.status,
    createdAt: report.createdAt.toISOString(),
  });
}

/** GET /v1/lookup?domain=... — public */
async function lookupMerchant(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const parsedUrl = new URL(req.url ?? '/', 'http://localhost');
  const domain = parsedUrl.searchParams.get('domain');

  if (!domain) { json(res, 400, { error: 'domain query parameter is required' }); return; }

  const merchant = await prisma.merchant.findUnique({
    where: { domain },
    include: { assessments: { orderBy: { reviewedAt: 'desc' }, take: 1 } },
  });

  if (!merchant) { json(res, 404, { error: 'Merchant not found' }); return; }

  const assessment = merchant.assessments[0] ?? null;
  const response: MerchantLookupResponse = {
    domain: merchant.domain,
    name: merchant.name,
    verdict: merchant.currentVerdict as MerchantLookupResponse['verdict'],
    lastReviewedAt: merchant.lastReviewedAt?.toISOString() ?? null,
    pillarSnapshot: {
      transparency: (assessment?.transparencyRating ?? 'Unknown') as PillarRating,
      reliability: (assessment?.reliabilityRating ?? 'Unknown') as PillarRating,
      integrity: (assessment?.integrityRating ?? 'Unknown') as PillarRating,
      communication: (assessment?.communicationRating ?? 'Unknown') as PillarRating,
    },
    publicSummary: merchant.publicSummary,
    topReasons: assessment ? (JSON.parse(assessment.publicReasons) as string[]) : [],
    auditTrail: {
      reviewedAt: assessment?.reviewedAt.toISOString() ?? null,
      reviewerRole: assessment?.reviewerRole ?? null,
      triggerReason: assessment?.triggerReason ?? null,
    },
    methodologyVersion: METHODOLOGY_VERSION,
    flaggedForReview: assessment?.flaggedForReview ?? false,
  };
  json(res, 200, response);
}

// ---------------------------------------------------------------------------
// Shared types & serializers
// ---------------------------------------------------------------------------

interface AssessmentInput {
  transparencyRating: PillarRating;
  reliabilityRating: PillarRating;
  integrityRating: PillarRating;
  communicationRating: PillarRating;
  redFlags: string[];
  internalRationale: string;
  publicSummary: string;
  publicReasons: string[];
  triggerReason?: string;
  hasConflict?: boolean;
}

function serializeAssessment(a: {
  id: string;
  transparencyRating: string;
  reliabilityRating: string;
  integrityRating: string;
  communicationRating: string;
  redFlags: string;
  internalRationale: string;
  publicSummary: string;
  publicReasons: string;
  reviewedAt: Date;
  reviewerRole: string;
  triggerReason: string;
  hasConflict: boolean;
  flaggedForReview: boolean;
}) {
  return {
    id: a.id,
    transparencyRating: a.transparencyRating,
    reliabilityRating: a.reliabilityRating,
    integrityRating: a.integrityRating,
    communicationRating: a.communicationRating,
    redFlags: JSON.parse(a.redFlags) as string[],
    internalRationale: a.internalRationale,
    publicSummary: a.publicSummary,
    publicReasons: JSON.parse(a.publicReasons) as string[],
    reviewedAt: a.reviewedAt.toISOString(),
    reviewerRole: a.reviewerRole,
    triggerReason: a.triggerReason,
    hasConflict: a.hasConflict,
    flaggedForReview: a.flaggedForReview,
    methodologyVersion: METHODOLOGY_VERSION,
  };
}

// ---------------------------------------------------------------------------
// Request router
// ---------------------------------------------------------------------------

const server = http.createServer(async (req, res) => {
  const url = req.url ?? '/';
  const method = req.method?.toUpperCase() ?? 'GET';

  if (method === 'OPTIONS') { preflight(res); return; }

  try {
    // ── Public: auth ──────────────────────────────────────────────────────────
    if (method === 'POST' && url === '/api/auth/login') {
      await login(req, res); return;
    }

    // ── Public: extension lookup ──────────────────────────────────────────────
    const domainMatch = url.match(/^\/api\/merchants\/by-domain\/([^/?]+)$/);
    if (method === 'GET' && domainMatch) {
      await getMerchantByDomain(res, decodeURIComponent(domainMatch[1])); return;
    }

    if (method === 'GET' && url.startsWith('/v1/lookup')) {
      await lookupMerchant(req, res); return;
    }

    // ── Public: submit report ─────────────────────────────────────────────────
    if (method === 'POST' && url === '/api/reports') {
      await createReport(req, res); return;
    }

    // ── Protected: all routes below require a valid JWT ───────────────────────
    const user = getAuthUser(req);
    if (!user) { unauthorized(res); return; }

    // GET /api/merchants
    if (method === 'GET' && url === '/api/merchants') {
      await listMerchants(res); return;
    }

    // GET /api/merchants/:id
    const getMatch = url.match(/^\/api\/merchants\/([^/?]+)$/);
    if (method === 'GET' && getMatch) {
      await getMerchant(res, getMatch[1]); return;
    }

    // POST /api/merchants
    if (method === 'POST' && url === '/api/merchants') {
      await createMerchant(req, res, user.role); return;
    }

    // PUT /api/merchants/:id
    const putMatch = url.match(/^\/api\/merchants\/([^/?]+)$/);
    if (method === 'PUT' && putMatch) {
      await updateMerchant(req, res, putMatch[1], user.role); return;
    }

    // GET /api/reports
    if (method === 'GET' && url.startsWith('/api/reports') && !url.match(/\/api\/reports\/.+/)) {
      await listReports(req, res); return;
    }

    // PUT /api/reports/:id
    const reportPutMatch = url.match(/^\/api\/reports\/([^/?]+)$/);
    if (method === 'PUT' && reportPutMatch) {
      await updateReport(req, res, reportPutMatch[1]); return;
    }

    json(res, 404, { error: 'Not found' });
  } catch (err) {
    console.error('API error:', err);
    json(res, 500, { error: 'Internal server error' });
  }
});

server.listen(PORT, () => {
  console.log(`RateIt API listening on http://localhost:${PORT}`);
});

export default server;
