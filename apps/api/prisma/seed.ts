import path from 'path';
import bcrypt from 'bcryptjs';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '../src/generated/prisma/client';

const dbPath = path.resolve(__dirname, '../dev.db');
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  // Seed an AdminUser who performs the assessments
  const passwordHash = await bcrypt.hash('rateit-admin', 10);
  const reviewer = await prisma.adminUser.upsert({
    where: { email: 'reviewer@rateit.internal' },
    update: { passwordHash },
    create: {
      email: 'reviewer@rateit.internal',
      displayName: 'RateIt Reviewer',
      passwordHash,
      role: 'reviewer',
    },
  });

  // ── 1. Trusted merchant ─────────────────────────────────────────────────────
  const trusted = await prisma.merchant.upsert({
    where: { domain: 'shoptrusted.com.au' },
    update: {},
    create: {
      name: 'ShopTrusted',
      domain: 'shoptrusted.com.au',
      category: 'General Retail',
      currentVerdict: 'Trusted',
      lastReviewedAt: new Date('2025-11-01'),
      publicSummary:
        'ShopTrusted has a strong track record of transparent policies, fast dispute resolution, and consistent customer satisfaction.',
      status: 'active',
    },
  });

  await prisma.assessment.upsert({
    where: { id: 'assess-trusted-001' },
    update: {},
    create: {
      id: 'assess-trusted-001',
      merchantId: trusted.id,
      transparencyRating: 'Strong',
      reliabilityRating: 'Strong',
      integrityRating: 'Strong',
      communicationRating: 'Strong',
      redFlags: JSON.stringify([]),
      internalRationale:
        'All four trust pillars rated Strong. No red flags identified. Consistent positive shopper outcomes.',
      publicSummary:
        'ShopTrusted demonstrates best-practice transparency, reliability, integrity, and communication.',
      publicReasons: JSON.stringify([
        'Clear refund and returns policy',
        'Rapid customer support response',
        'No unresolved complaints',
      ]),
      reviewedBy: reviewer.id,
      reviewedAt: new Date('2025-11-01'),
    },
  });

  // ── 2. Caution merchant ──────────────────────────────────────────────────────
  const caution = await prisma.merchant.upsert({
    where: { domain: 'mixedmart.com.au' },
    update: {},
    create: {
      name: 'MixedMart',
      domain: 'mixedmart.com.au',
      category: 'Electronics',
      currentVerdict: 'Caution',
      lastReviewedAt: new Date('2025-10-15'),
      publicSummary:
        'MixedMart has acceptable practices in some areas but shoppers should verify policies before purchasing.',
      status: 'active',
    },
  });

  await prisma.assessment.upsert({
    where: { id: 'assess-caution-001' },
    update: {},
    create: {
      id: 'assess-caution-001',
      merchantId: caution.id,
      transparencyRating: 'Mixed',
      reliabilityRating: 'Mixed',
      integrityRating: 'Strong',
      communicationRating: 'Weak',
      redFlags: JSON.stringify(['Slow response to refund requests']),
      internalRationale:
        'Mixed signals across reliability and transparency. Communication delays noted in shopper reports.',
      publicSummary:
        'MixedMart shows inconsistencies in reliability and communication. Proceed with awareness.',
      publicReasons: JSON.stringify([
        'Mixed reliability record',
        'Slow communication on disputes',
        'Returns policy lacks clarity',
      ]),
      reviewedBy: reviewer.id,
      reviewedAt: new Date('2025-10-15'),
    },
  });

  // ── 3. High Risk merchant ────────────────────────────────────────────────────
  const highRisk = await prisma.merchant.upsert({
    where: { domain: 'riskybuy.com.au' },
    update: {},
    create: {
      name: 'RiskyBuy',
      domain: 'riskybuy.com.au',
      category: 'Fashion',
      currentVerdict: 'High Risk',
      lastReviewedAt: new Date('2025-09-20'),
      publicSummary:
        'RiskyBuy has multiple unresolved complaints, misleading product descriptions, and poor dispute outcomes.',
      status: 'under_review',
    },
  });

  await prisma.assessment.upsert({
    where: { id: 'assess-highrisk-001' },
    update: {},
    create: {
      id: 'assess-highrisk-001',
      merchantId: highRisk.id,
      transparencyRating: 'Weak',
      reliabilityRating: 'Weak',
      integrityRating: 'Weak',
      communicationRating: 'Weak',
      redFlags: JSON.stringify([
        'Multiple unresolved chargebacks',
        'Misleading product descriptions',
        'No accessible contact information',
      ]),
      internalRationale:
        'Significant red flags across all trust pillars. Pattern of shopper harm confirmed. Escalated for monitoring.',
      publicSummary:
        'RiskyBuy has a history of misleading listings, non-delivery, and unresolved refund disputes.',
      publicReasons: JSON.stringify([
        'Pattern of non-delivery reports',
        'Misleading product listings',
        'Unresolved refund disputes',
        'No accessible customer service',
      ]),
      reviewedBy: reviewer.id,
      reviewedAt: new Date('2025-09-20'),
    },
  });

  // ── 4. Insufficient Data merchant ───────────────────────────────────────────
  const insufficient = await prisma.merchant.upsert({
    where: { domain: 'newshop.com.au' },
    update: {},
    create: {
      name: 'NewShop',
      domain: 'newshop.com.au',
      category: 'Home & Garden',
      currentVerdict: 'Insufficient Data',
      lastReviewedAt: null,
      publicSummary:
        'NewShop has not yet been assessed. Insufficient shopper data available to assign a verdict.',
      status: 'active',
    },
  });

  await prisma.assessment.upsert({
    where: { id: 'assess-insufficient-001' },
    update: {},
    create: {
      id: 'assess-insufficient-001',
      merchantId: insufficient.id,
      transparencyRating: 'Unknown',
      reliabilityRating: 'Unknown',
      integrityRating: 'Unknown',
      communicationRating: 'Unknown',
      redFlags: JSON.stringify([]),
      internalRationale:
        'Merchant recently launched. No shopper reports or historical data available for scoring.',
      publicSummary:
        'Not enough data to rate this merchant. Check back after more shopper feedback is collected.',
      publicReasons: JSON.stringify(['No shopper feedback recorded yet']),
      reviewedBy: reviewer.id,
      reviewedAt: new Date('2025-12-01'),
    },
  });

  console.log('✅ Seed complete — 4 merchants created:');
  console.log(`   • ${trusted.name} (${trusted.currentVerdict})`);
  console.log(`   • ${caution.name} (${caution.currentVerdict})`);
  console.log(`   • ${highRisk.name} (${highRisk.currentVerdict})`);
  console.log(`   • ${insufficient.name} (${insufficient.currentVerdict})`);
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
