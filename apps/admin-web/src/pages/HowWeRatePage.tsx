import { METHODOLOGY_VERSION } from '@rateit/shared-types';

function PillarCard({
  name,
  icon,
  description,
  examples,
}: {
  name: string;
  icon: string;
  description: string;
  examples: string[];
}) {
  return (
    <div className="pillar-card">
      <div className="pillar-card-header">
        <span className="pillar-icon">{icon}</span>
        <h3 className="pillar-name">{name}</h3>
      </div>
      <p className="pillar-desc">{description}</p>
      <ul className="pillar-examples">
        {examples.map((ex) => <li key={ex}>{ex}</li>)}
      </ul>
    </div>
  );
}

function VerdictRow({
  verdict,
  cls,
  rule,
}: {
  verdict: string;
  cls: string;
  rule: string;
}) {
  return (
    <tr>
      <td><span className={`badge ${cls}`}>{verdict}</span></td>
      <td>{rule}</td>
    </tr>
  );
}

function HowWeRatePage() {
  return (
    <div className="how-we-rate">

      <div className="page-header">
        <h1>How We Rate</h1>
        <span className="methodology-badge">Methodology v{METHODOLOGY_VERSION}</span>
      </div>

      <div className="hwr-section">
        <p className="hwr-intro">
          RateIt Signal uses a structured, evidence-based framework to assess online merchants.
          Every verdict is produced by applying the same fixed ruleset to four independently
          assessed trust pillars. <strong>No merchant can pay for a rating.</strong> No rating
          can be changed by commercial pressure. If a reviewer has any relationship with a
          merchant, the assessment is blocked and flagged for second review.
        </p>
      </div>

      {/* ── The four pillars ── */}
      <div className="hwr-section">
        <h2 className="hwr-heading">The Four Trust Pillars</h2>
        <p className="hwr-subheading">
          Each pillar is rated independently as <strong>Strong</strong>, <strong>Mixed</strong>,{' '}
          <strong>Weak</strong>, or <strong>Unknown</strong> based on publicly available evidence.
        </p>

        <div className="pillar-grid">
          <PillarCard
            name="Transparency"
            icon="📋"
            description="Does the merchant clearly disclose its policies, ownership, pricing, and terms before you buy?"
            examples={[
              'Return and refund policy is easy to find',
              'Pricing and fees are stated upfront',
              'Physical address and ABN are published',
              'Terms of service are written in plain language',
            ]}
          />
          <PillarCard
            name="Reliability"
            icon="📦"
            description="Does the merchant consistently deliver what it promises — on time, as described, without surprises?"
            examples={[
              'Orders arrive within the stated timeframe',
              'Products match the listing description',
              'Stock availability is accurately shown',
              'Consistent shopper experiences over time',
            ]}
          />
          <PillarCard
            name="Integrity"
            icon="🤝"
            description="Does the merchant operate honestly — no misleading claims, no fake reviews, no hidden traps?"
            examples={[
              'No pattern of misleading product descriptions',
              'Reviews appear genuine and unmanipulated',
              'No hidden subscription charges',
              'Dispute outcomes are fair and documented',
            ]}
          />
          <PillarCard
            name="Communication"
            icon="💬"
            description="Does the merchant respond promptly and constructively when shoppers need help or raise a concern?"
            examples={[
              'Customer support replies within a reasonable time',
              'Complaints are acknowledged and resolved',
              'Contact details are real and monitored',
              'No pattern of ignoring or dismissing shoppers',
            ]}
          />
        </div>
      </div>

      {/* ── Verdict rules ── */}
      <div className="hwr-section">
        <h2 className="hwr-heading">How Verdicts Are Calculated</h2>
        <p className="hwr-subheading">
          Rules are applied in priority order. The first rule that matches determines the verdict.
        </p>

        <div className="table-wrapper" style={{ marginTop: 16 }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 160 }}>Verdict</th>
                <th>Rule</th>
              </tr>
            </thead>
            <tbody>
              <VerdictRow
                verdict="Insufficient Data"
                cls="badge-insufficient"
                rule="All four pillars are Unknown and no red flags — OR — a conflict of interest has been declared. No verdict can be issued until more evidence is gathered or a second reviewer clears the conflict."
              />
              <VerdictRow
                verdict="High Risk"
                cls="badge-high-risk"
                rule="2 or more pillars are Weak — OR — 2 or more red flags are recorded. Either condition alone is enough to trigger High Risk."
              />
              <VerdictRow
                verdict="Trusted"
                cls="badge-trusted"
                rule="At least 3 pillars are Strong AND there are zero red flags."
              />
              <VerdictRow
                verdict="Caution"
                cls="badge-caution"
                rule="Everything else — mixed signals, one weak pillar, one red flag, or an uneven evidence base."
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Conflict of interest ── */}
      <div className="hwr-section">
        <h2 className="hwr-heading">Conflict of Interest Policy</h2>
        <p className="hwr-body">
          If a reviewer or their organisation has any commercial, personal, or financial
          relationship with a merchant — including having received payment, gifts, or favourable
          treatment — they must declare a conflict before completing an assessment.
        </p>
        <p className="hwr-body">
          When a conflict is declared, the verdict is <strong>automatically locked to Insufficient
          Data</strong> and the assessment is flagged for a mandatory second review by a
          different reviewer. This rule is enforced by the verdict engine — it cannot be
          overridden from the UI.
        </p>
      </div>

      {/* ── Red flags ── */}
      <div className="hwr-section">
        <h2 className="hwr-heading">What Are Red Flags?</h2>
        <p className="hwr-body">
          Red flags are specific, documented behaviours that represent meaningful shopper harm —
          beyond what is captured in pillar ratings. Examples include a pattern of non-delivery,
          confirmed fraudulent listings, or multiple unresolved chargebacks. Two or more red
          flags triggers a High Risk verdict regardless of pillar ratings.
        </p>
      </div>

      {/* ── Methodology version ── */}
      <div className="hwr-section hwr-version-block">
        <div className="hwr-version-label">Current methodology</div>
        <div className="hwr-version-number">Version {METHODOLOGY_VERSION}</div>
        <p className="hwr-body" style={{ marginTop: 8 }}>
          Every API response includes a <code>methodologyVersion</code> field so developers and
          auditors can always verify which ruleset produced a given verdict. When the rules
          change, the version increments and historical assessments retain their original version tag.
        </p>
      </div>

    </div>
  );
}

export default HowWeRatePage;
