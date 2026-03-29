export type {
  Verdict,
  PillarRating,
  PillarSnapshot,
} from '@rateit/shared-types';

import type { Verdict, PillarRating } from '@rateit/shared-types';

/** Inputs accepted by the verdict engine. */
export interface VerdictInput {
  transparencyRating: PillarRating;
  reliabilityRating: PillarRating;
  integrityRating: PillarRating;
  communicationRating: PillarRating;
  redFlags: string[];
  /** Optional: number of independent evidence sources consulted (≥1 = has data). */
  evidenceSources?: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Return true when every pillar is Unknown and there are no red flags. */
function isInsufficientData(input: VerdictInput): boolean {
  const allUnknown =
    input.transparencyRating === 'Unknown' &&
    input.reliabilityRating  === 'Unknown' &&
    input.integrityRating    === 'Unknown' &&
    input.communicationRating === 'Unknown';

  if (allUnknown && input.redFlags.length === 0) return true;
  if (input.evidenceSources !== undefined && input.evidenceSources < 1) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Derive a deterministic RateIt verdict from pillar ratings and red flags.
 *
 * Rules (evaluated in priority order):
 *  1. Insufficient Data — all pillars Unknown with no red flags, or
 *                         evidenceSources explicitly set to 0.
 *  2. High Risk         — 2+ Weak pillars  OR  2+ red flags
 *                         (a severe red-flag cluster / harmful pattern).
 *  3. Trusted           — at least 3 Strong pillars and 0 red flags.
 *  4. Caution           — everything else (mixed profile).
 */
export function computeVerdict(input: VerdictInput): Verdict {
  if (isInsufficientData(input)) return 'Insufficient Data';

  const pillars: PillarRating[] = [
    input.transparencyRating,
    input.reliabilityRating,
    input.integrityRating,
    input.communicationRating,
  ];

  const weakCount   = pillars.filter(p => p === 'Weak').length;
  const strongCount = pillars.filter(p => p === 'Strong').length;
  const redFlagCount = input.redFlags.length;

  // High Risk: 2+ weak pillars OR severe red-flag cluster (2+)
  if (weakCount >= 2 || redFlagCount >= 2) return 'High Risk';

  // Trusted: at least 3 strong pillars and no red flags
  if (strongCount >= 3 && redFlagCount === 0) return 'Trusted';

  // Caution: everything else (one weak pillar, one red flag, mixed profile, etc.)
  return 'Caution';
}
