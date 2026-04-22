import { describe, it, expect } from 'vitest';
import { computeVerdict } from '../index';
import type { VerdictInput } from '../index';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function input(overrides: Partial<VerdictInput> = {}): VerdictInput {
  return {
    transparencyRating:  'Unknown',
    reliabilityRating:   'Unknown',
    integrityRating:     'Unknown',
    communicationRating: 'Unknown',
    redFlags: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Clear-verdict cases
// ---------------------------------------------------------------------------

describe('computeVerdict — Trusted', () => {
  it('returns Trusted when 4 Strong pillars and no red flags', () => {
    expect(
      computeVerdict(input({
        transparencyRating:  'Strong',
        reliabilityRating:   'Strong',
        integrityRating:     'Strong',
        communicationRating: 'Strong',
      })),
    ).toBe('Trusted');
  });

  it('returns Trusted when exactly 3 Strong pillars and one Mixed, no red flags', () => {
    expect(
      computeVerdict(input({
        transparencyRating:  'Strong',
        reliabilityRating:   'Strong',
        integrityRating:     'Strong',
        communicationRating: 'Mixed',
      })),
    ).toBe('Trusted');
  });
});

describe('computeVerdict — Caution', () => {
  it('returns Caution for a mixed profile (2 Strong, 1 Mixed, 1 Weak, 0 red flags)', () => {
    expect(
      computeVerdict(input({
        transparencyRating:  'Strong',
        reliabilityRating:   'Strong',
        integrityRating:     'Mixed',
        communicationRating: 'Weak',
      })),
    ).toBe('Caution');
  });

  it('returns Caution when 4 Strong pillars but 1 red flag', () => {
    expect(
      computeVerdict(input({
        transparencyRating:  'Strong',
        reliabilityRating:   'Strong',
        integrityRating:     'Strong',
        communicationRating: 'Strong',
        redFlags: ['misleading returns policy'],
      })),
    ).toBe('Caution');
  });
});

describe('computeVerdict — High Risk', () => {
  it('returns High Risk when 2 Weak pillars', () => {
    expect(
      computeVerdict(input({
        transparencyRating:  'Weak',
        reliabilityRating:   'Weak',
        integrityRating:     'Mixed',
        communicationRating: 'Mixed',
      })),
    ).toBe('High Risk');
  });

  it('returns High Risk when 2+ red flags (severe red-flag cluster)', () => {
    expect(
      computeVerdict(input({
        transparencyRating:  'Mixed',
        reliabilityRating:   'Mixed',
        integrityRating:     'Mixed',
        communicationRating: 'Mixed',
        redFlags: ['fake reviews', 'no refund issued'],
      })),
    ).toBe('High Risk');
  });

  it('returns High Risk when 3 Weak pillars and multiple red flags', () => {
    expect(
      computeVerdict(input({
        transparencyRating:  'Weak',
        reliabilityRating:   'Weak',
        integrityRating:     'Weak',
        communicationRating: 'Mixed',
        redFlags: ['scam reports', 'hidden fees', 'domain recently changed'],
      })),
    ).toBe('High Risk');
  });
});

describe('computeVerdict — Insufficient Data', () => {
  it('returns Insufficient Data when all pillars are Unknown with no red flags', () => {
    expect(computeVerdict(input())).toBe('Insufficient Data');
  });

  it('returns Insufficient Data when evidenceSources is 0', () => {
    expect(
      computeVerdict(input({
        transparencyRating:  'Strong',
        reliabilityRating:   'Strong',
        integrityRating:     'Strong',
        communicationRating: 'Strong',
        evidenceSources: 0,
      })),
    ).toBe('Insufficient Data');
  });
});

// ---------------------------------------------------------------------------
// Conflicting-input edge case
// ---------------------------------------------------------------------------

describe('computeVerdict — conflicting input', () => {
  it('returns High Risk (not Trusted) when 3 Strong pillars conflict with 2 red flags', () => {
    expect(
      computeVerdict(input({
        transparencyRating:  'Strong',
        reliabilityRating:   'Strong',
        integrityRating:     'Strong',
        communicationRating: 'Mixed',
        redFlags: ['counterfeit goods complaint', 'unresolved chargeback'],
      })),
    ).toBe('High Risk');
  });
});

// ---------------------------------------------------------------------------
// Conflict of interest — Rule 0, highest priority
// ---------------------------------------------------------------------------

describe('computeVerdict — conflict of interest', () => {
  it('returns Insufficient Data when hasConflict is true, even with 4 Strong pillars', () => {
    expect(
      computeVerdict(input({
        transparencyRating:  'Strong',
        reliabilityRating:   'Strong',
        integrityRating:     'Strong',
        communicationRating: 'Strong',
        hasConflict: true,
      })),
    ).toBe('Insufficient Data');
  });

  it('returns Insufficient Data when hasConflict is true, even with High Risk indicators', () => {
    expect(
      computeVerdict(input({
        transparencyRating:  'Weak',
        reliabilityRating:   'Weak',
        integrityRating:     'Weak',
        communicationRating: 'Weak',
        redFlags: ['fraud', 'non-delivery'],
        hasConflict: true,
      })),
    ).toBe('Insufficient Data');
  });

  it('still returns Trusted when hasConflict is false', () => {
    expect(
      computeVerdict(input({
        transparencyRating:  'Strong',
        reliabilityRating:   'Strong',
        integrityRating:     'Strong',
        communicationRating: 'Strong',
        hasConflict: false,
      })),
    ).toBe('Trusted');
  });
});
