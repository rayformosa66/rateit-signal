/**
 * Shared TypeScript types for the RateIt Signal platform.
 * Used across apps/extension, apps/admin-web, apps/api, and packages/verdict-engine.
 */

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

/** Response shape returned by the merchant-by-domain API endpoint. */
export interface MerchantLookupResponse {
  domain: string;
  name: string | null;
  verdict: Verdict;
  lastReviewedAt: string | null;
  pillarSnapshot: PillarSnapshot;
  publicSummary: string;
  topReasons: string[];
}
