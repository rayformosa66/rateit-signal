/**
 * RateIt Admin API — merchant assessment CRUD.
 *
 * Endpoints:
 *   GET  /api/merchants           — list all merchants with latest assessment
 *   GET  /api/merchants/:id       — single merchant + latest assessment
 *   POST /api/merchants           — create merchant + assessment
 *   PUT  /api/merchants/:id       — update merchant + assessment
 */

import http from 'http';
import path from 'path';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from './generated/prisma/client';
import { computeVerdict } from '@rateit/verdict-engine';
import type { PillarRating } from '@rateit/shared-types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Placeholder reviewer identity for Sprint 1 (no auth yet). */
const REVIEWER_PLACEHOLDER = 'reviewer@rateit.internal';

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

/** Read the full request body as a string. */
function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: Buffer) => { data += chunk.toString(); });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

/** Send a JSON response. */
function json(res: http.ServerResponse, statusCode: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(payload);
}

/** Attach CORS pre-flight headers and end the response. */
function preflight(res: http.ServerResponse): void {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end();
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

/** GET /api/merchants */
async function listMerchants(res: http.ServerResponse): Promise<void> {
  const merchants = await prisma.merchant.findMany({
    orderBy: { name: 'asc' },
    include: {
      assessments: {
        orderBy: { reviewedAt: 'desc' },
        take: 1,
      },
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
      assessment: assessment
        ? {
            id: assessment.id,
            transparencyRating: assessment.transparencyRating,
            reliabilityRating: assessment.reliabilityRating,
            integrityRating: assessment.integrityRating,
            communicationRating: assessment.communicationRating,
            redFlags: JSON.parse(assessment.redFlags) as string[],
            internalRationale: assessment.internalRationale,
            publicSummary: assessment.publicSummary,
            publicReasons: JSON.parse(assessment.publicReasons) as string[],
            reviewedAt: assessment.reviewedAt.toISOString(),
          }
        : null,
    };
  });

  json(res, 200, result);
}

/** GET /api/merchants/:id */
async function getMerchant(
  res: http.ServerResponse,
  id: string,
): Promise<void> {
  const merchant = await prisma.merchant.findUnique({
    where: { id },
    include: {
      assessments: {
        orderBy: { reviewedAt: 'desc' },
        take: 1,
      },
    },
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
    assessment: assessment
      ? {
          id: assessment.id,
          transparencyRating: assessment.transparencyRating,
          reliabilityRating: assessment.reliabilityRating,
          integrityRating: assessment.integrityRating,
          communicationRating: assessment.communicationRating,
          redFlags: JSON.parse(assessment.redFlags) as string[],
          internalRationale: assessment.internalRationale,
          publicSummary: assessment.publicSummary,
          publicReasons: JSON.parse(assessment.publicReasons) as string[],
          reviewedAt: assessment.reviewedAt.toISOString(),
        }
      : null,
  });
}

/** POST /api/merchants */
async function createMerchant(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
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
    assessment?: {
      transparencyRating: PillarRating;
      reliabilityRating: PillarRating;
      integrityRating: PillarRating;
      communicationRating: PillarRating;
      redFlags: string[];
      internalRationale: string;
      publicSummary: string;
      publicReasons: string[];
    };
  };

  if (!name || !domain || !category) {
    json(res, 422, { error: 'name, domain, and category are required' });
    return;
  }

  // Compute verdict from assessment if provided
  const verdict = assessment
    ? computeVerdict({
        transparencyRating: assessment.transparencyRating,
        reliabilityRating: assessment.reliabilityRating,
        integrityRating: assessment.integrityRating,
        communicationRating: assessment.communicationRating,
        redFlags: assessment.redFlags,
      })
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
    const reviewedBy = REVIEWER_PLACEHOLDER;
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
        reviewedBy,
        reviewedAt: lastReviewedAt ? new Date(lastReviewedAt) : new Date(),
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
    assessment: savedAssessment
      ? {
          id: savedAssessment.id,
          transparencyRating: savedAssessment.transparencyRating,
          reliabilityRating: savedAssessment.reliabilityRating,
          integrityRating: savedAssessment.integrityRating,
          communicationRating: savedAssessment.communicationRating,
          redFlags: JSON.parse(savedAssessment.redFlags) as string[],
          internalRationale: savedAssessment.internalRationale,
          publicSummary: savedAssessment.publicSummary,
          publicReasons: JSON.parse(savedAssessment.publicReasons) as string[],
          reviewedAt: savedAssessment.reviewedAt.toISOString(),
        }
      : null,
  });
}

/** PUT /api/merchants/:id */
async function updateMerchant(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  id: string,
): Promise<void> {
  const existing = await prisma.merchant.findUnique({ where: { id } });
  if (!existing) {
    json(res, 404, { error: 'Merchant not found' });
    return;
  }

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
    assessment?: {
      transparencyRating: PillarRating;
      reliabilityRating: PillarRating;
      integrityRating: PillarRating;
      communicationRating: PillarRating;
      redFlags: string[];
      internalRationale: string;
      publicSummary: string;
      publicReasons: string[];
    };
  };

  if (!name || !domain || !category) {
    json(res, 422, { error: 'name, domain, and category are required' });
    return;
  }

  const verdict = assessment
    ? computeVerdict({
        transparencyRating: assessment.transparencyRating,
        reliabilityRating: assessment.reliabilityRating,
        integrityRating: assessment.integrityRating,
        communicationRating: assessment.communicationRating,
        redFlags: assessment.redFlags,
      })
    : existing.currentVerdict;

  const merchant = await prisma.merchant.update({
    where: { id },
    data: {
      name,
      domain,
      category,
      status: status || existing.status,
      lastReviewedAt: lastReviewedAt ? new Date(lastReviewedAt) : existing.lastReviewedAt,
      publicSummary: assessment?.publicSummary ?? existing.publicSummary,
      currentVerdict: verdict,
      updatedAt: new Date(),
    },
  });

  let savedAssessment = null;
  if (assessment) {
    const reviewedBy = REVIEWER_PLACEHOLDER;
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
        reviewedBy,
        reviewedAt: lastReviewedAt ? new Date(lastReviewedAt) : new Date(),
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
    assessment: latestAssessment
      ? {
          id: latestAssessment.id,
          transparencyRating: latestAssessment.transparencyRating,
          reliabilityRating: latestAssessment.reliabilityRating,
          integrityRating: latestAssessment.integrityRating,
          communicationRating: latestAssessment.communicationRating,
          redFlags: JSON.parse(latestAssessment.redFlags) as string[],
          internalRationale: latestAssessment.internalRationale,
          publicSummary: latestAssessment.publicSummary,
          publicReasons: JSON.parse(latestAssessment.publicReasons) as string[],
          reviewedAt: latestAssessment.reviewedAt.toISOString(),
        }
      : null,
  });
}

// ---------------------------------------------------------------------------
// Request router
// ---------------------------------------------------------------------------

const server = http.createServer(async (req, res) => {
  const url = req.url ?? '/';
  const method = req.method?.toUpperCase() ?? 'GET';

  // Pre-flight CORS
  if (method === 'OPTIONS') {
    preflight(res);
    return;
  }

  try {
    // GET /api/merchants
    if (method === 'GET' && url === '/api/merchants') {
      await listMerchants(res);
      return;
    }

    // GET /api/merchants/:id
    const getMatch = url.match(/^\/api\/merchants\/([^/?]+)$/);
    if (method === 'GET' && getMatch) {
      await getMerchant(res, getMatch[1]);
      return;
    }

    // POST /api/merchants
    if (method === 'POST' && url === '/api/merchants') {
      await createMerchant(req, res);
      return;
    }

    // PUT /api/merchants/:id
    const putMatch = url.match(/^\/api\/merchants\/([^/?]+)$/);
    if (method === 'PUT' && putMatch) {
      await updateMerchant(req, res, putMatch[1]);
      return;
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
