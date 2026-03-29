/**
 * Local copy of the verdict computation for use in the admin-web browser bundle.
 * Mirrors the logic in packages/verdict-engine/src/index.ts exactly.
 * The shared package uses CommonJS output which is not compatible with Vite's ESM bundler.
 */

import type { Verdict, PillarRating } from '@rateit/shared-types';

export interface VerdictInput {
  transparencyRating: PillarRating;
  reliabilityRating: PillarRating;
  integrityRating: PillarRating;
  communicationRating: PillarRating;
  redFlags: string[];
  evidenceSources?: number;
}

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

  if (weakCount >= 2 || redFlagCount >= 2) return 'High Risk';
  if (strongCount >= 3 && redFlagCount === 0) return 'Trusted';
  return 'Caution';
}
