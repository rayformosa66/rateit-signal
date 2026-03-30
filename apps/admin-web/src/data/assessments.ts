import type { Assessment } from '@rateit/shared-types';

/** Mock assessments matching the seeded database records. */
export const MOCK_ASSESSMENTS: (Assessment & { merchantId: string })[] = [
  {
    id: 'assess-trusted-001',
    merchantId: 'merchant-001',
    transparencyRating: 'Strong',
    reliabilityRating: 'Strong',
    integrityRating: 'Strong',
    communicationRating: 'Strong',
    redFlags: [],
    internalRationale:
      'All four trust pillars rated Strong. No red flags identified. Consistent positive shopper outcomes.',
    publicSummary:
      'ShopTrusted demonstrates best-practice transparency, reliability, integrity, and communication.',
    publicReasons: [
      'Clear refund and returns policy',
      'Rapid customer support response',
      'No unresolved complaints',
    ],
    reviewedBy: 'reviewer@rateit.internal',
    reviewedAt: '2025-11-01T00:00:00.000Z',
  },
  {
    id: 'assess-caution-001',
    merchantId: 'merchant-002',
    transparencyRating: 'Mixed',
    reliabilityRating: 'Mixed',
    integrityRating: 'Strong',
    communicationRating: 'Weak',
    redFlags: ['Slow response to refund requests'],
    internalRationale:
      'Mixed signals across reliability and transparency. Communication delays noted in shopper reports.',
    publicSummary:
      'MixedMart shows inconsistencies in reliability and communication. Proceed with awareness.',
    publicReasons: [
      'Mixed reliability record',
      'Slow communication on disputes',
      'Returns policy lacks clarity',
    ],
    reviewedBy: 'reviewer@rateit.internal',
    reviewedAt: '2025-10-15T00:00:00.000Z',
  },
  {
    id: 'assess-highrisk-001',
    merchantId: 'merchant-003',
    transparencyRating: 'Weak',
    reliabilityRating: 'Weak',
    integrityRating: 'Weak',
    communicationRating: 'Weak',
    redFlags: [
      'Multiple unresolved chargebacks',
      'Misleading product descriptions',
      'No accessible contact information',
    ],
    internalRationale:
      'Significant red flags across all trust pillars. Pattern of shopper harm confirmed. Escalated for monitoring.',
    publicSummary:
      'RiskyBuy has a history of misleading listings, non-delivery, and unresolved refund disputes.',
    publicReasons: [
      'Pattern of non-delivery reports',
      'Misleading product listings',
      'Unresolved refund disputes',
      'No accessible customer service',
    ],
    reviewedBy: 'reviewer@rateit.internal',
    reviewedAt: '2025-09-20T00:00:00.000Z',
  },
  {
    id: 'assess-insufficient-001',
    merchantId: 'merchant-004',
    transparencyRating: 'Unknown',
    reliabilityRating: 'Unknown',
    integrityRating: 'Unknown',
    communicationRating: 'Unknown',
    redFlags: [],
    internalRationale:
      'Merchant recently launched. No shopper reports or historical data available for scoring.',
    publicSummary:
      'Not enough data to rate this merchant. Check back after more shopper feedback is collected.',
    publicReasons: ['No shopper feedback recorded yet'],
    reviewedBy: 'reviewer@rateit.internal',
    reviewedAt: '2025-12-01T00:00:00.000Z',
  },
];
