import type { Merchant } from '@rateit/shared-types';

/** Mock merchants matching the seeded database records. */
export const MOCK_MERCHANTS: Merchant[] = [
  {
    id: 'merchant-001',
    name: 'ShopTrusted',
    domain: 'shoptrusted.com.au',
    category: 'General Retail',
    currentVerdict: 'Trusted',
    lastReviewedAt: '2025-11-01T00:00:00.000Z',
    publicSummary:
      'ShopTrusted has a strong track record of transparent policies, fast dispute resolution, and consistent customer satisfaction.',
    status: 'active',
  },
  {
    id: 'merchant-002',
    name: 'MixedMart',
    domain: 'mixedmart.com.au',
    category: 'Electronics',
    currentVerdict: 'Caution',
    lastReviewedAt: '2025-10-15T00:00:00.000Z',
    publicSummary:
      'MixedMart has acceptable practices in some areas but shoppers should verify policies before purchasing.',
    status: 'active',
  },
  {
    id: 'merchant-003',
    name: 'RiskyBuy',
    domain: 'riskybuy.com.au',
    category: 'Fashion',
    currentVerdict: 'High Risk',
    lastReviewedAt: '2025-09-20T00:00:00.000Z',
    publicSummary:
      'RiskyBuy has multiple unresolved complaints, opaque return policies, and repeated fulfilment failures.',
    status: 'under_review',
  },
  {
    id: 'merchant-004',
    name: 'NewShop',
    domain: 'newshop.com.au',
    category: 'General Retail',
    currentVerdict: 'Insufficient Data',
    lastReviewedAt: '2025-12-01T00:00:00.000Z',
    publicSummary: 'Insufficient data available to assess this merchant at this time.',
    status: 'active',
  },
];
