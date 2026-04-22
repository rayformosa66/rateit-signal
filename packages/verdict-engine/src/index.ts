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
  /**
   * Conflict of interest flag. When true the verdict is unconditionally
   * overridden to 'Insufficient Data' and the assessment is flagged for
   * second review. Enforced here in the engine, not only in the UI.
   */
  hasConflict?: boolean;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Return true when every pillar is Unknown and there are no red flags. */
function isInsufficientData(input: VerdictInput): boolean {
  const allUnknown =
    input.transparencyRating  === 'Unknown' &&
    input.reliabilityRating   === 'Unknown' &&
    input.integrityRating     === 'Unknown' &&
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
 *  0. Conflict of interest — hasConflict=true always returns Insufficient Data
 *     regardless of pillar ratings. Enforced in the engine, not only the UI.
 *  1. Insufficient Data   — all pillars Unknown with no red flags, or
 *                           evidenceSources explicitly set to 0.
 *  2. High Risk           — 2+ Weak pillars  OR  2+ red flags.
 *  3. Trusted             — at least 3 Strong pillars and 0 red flags.
 *  4. Caution             — everything else (mixed profile).
 */
export function computeVerdict(input: VerdictInput): Verdict {
  // Rule 0: conflict of interest unconditionally blocks a positive verdict.
  if (input.hasConflict) return 'Insufficient Data';

  if (isInsufficientData(input)) return 'Insufficient Data';

  const pillars: PillarRating[] = [
    input.transparencyRating,
    input.reliabilityRating,
    input.integrityRating,
    input.communicationRating,
  ];

  const weakCount    = pillars.filter(p => p === 'Weak').length;
  const strongCount  = pillars.filter(p => p === 'Strong').length;
  const redFlagCount = input.redFlags.length;

  if (weakCount >= 2 || redFlagCount >= 2) return 'High Risk';
  if (strongCount >= 3 && redFlagCount === 0) return 'Trusted';
  return 'Caution';
}
