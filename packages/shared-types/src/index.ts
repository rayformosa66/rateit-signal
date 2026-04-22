/**
 * Shared TypeScript types for the RateIt Signal platform.
 * Used across apps/extension, apps/admin-web, apps/api, and packages/verdict-engine.
 */

/** Semantic version of the assessment methodology ruleset. */
export const METHODOLOGY_VERSION = '1.0.0';

/** Final trust verdict assigned to a merchant. */
export type Verdict = 'Trusted' | 'Caution' | 'High Risk' | 'Insufficient Data';

/** Rating for a single trust pillar. */
export type PillarRating = 'Strong' | 'Mixed' | 'Weak' | 'Unknown';

/** Lifecycle status of a merchant record. */
export type MerchantStatus = 'active' | 'under_review' | 'suspended';

/** Lifecycle status of a user-submitted report. */
export type ReportStatus = 'new' | 'under_review' | 'resolved';

/** A reviewed merchant record stored in the database. */
export interface Merchant {
  id: string;
  name: string;
  domain: string;
  category: string;
  currentVerdict: Verdict;
  lastReviewedAt: string;
  publicSummary: string;
  status: MerchantStatus;
}

/** A trust assessment completed by an internal reviewer. */
export interface Assessment {
  id: string;
  merchantId: string;
  transparencyRating: PillarRating;
  reliabilityRating: PillarRating;
  integrityRating: PillarRating;
  communicationRating: PillarRating;
  redFlags: string[];
  internalRationale: string;
  publicSummary: string;
  publicReasons: string[];
  reviewedBy: string;
  reviewedAt: string;
  reviewerRole: string;
  triggerReason: string;
  hasConflict: boolean;
  flaggedForReview: boolean;
}

/** A trust report submitted by a shopper. */
export interface UserReport {
  id: string;
  merchantId?: string;
  domain: string;
  reportType: string;
  description: string;
  screenshotUrl?: string;
  status: ReportStatus;
  createdAt: string;
}

/** Snapshot of pillar ratings included in API responses. */
export interface PillarSnapshot {
  transparency: PillarRating;
  reliability: PillarRating;
  integrity: PillarRating;
  communication: PillarRating;
}

/** Public audit trail attached to every verdict. */
export interface AuditTrail {
  reviewedAt: string | null;
  reviewerRole: string | null;
  triggerReason: string | null;
}

/** Response shape returned by the merchant-by-domain API endpoint. */
export interface MerchantLookupResponse {
  domain: string;
  name: string;
  verdict: Verdict;
  lastReviewedAt: string | null;
  pillarSnapshot: PillarSnapshot;
  publicSummary: string;
  topReasons: string[];
  auditTrail: AuditTrail;
  methodologyVersion: string;
  flaggedForReview: boolean;
}
