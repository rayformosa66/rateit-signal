import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Merchant, Verdict, MerchantStatus } from '@rateit/shared-types';

const API_BASE = 'http://localhost:3001';

function safeParseJSON(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

interface Assessment {
  id: string;
  transparencyRating: string;
  reliabilityRating: string;
  integrityRating: string;
  communicationRating: string;
  redFlags: string;
  internalRationale: string;
  publicSummary: string;
  publicReasons: string;
  reviewedBy: string;
  reviewedAt: string;
}

interface MerchantWithAssessment extends Merchant {
  assessments: Assessment[];
}

const VERDICT_COLORS: Record<Verdict, { bg: string; color: string }> = {
  'Trusted': { bg: '#d4edda', color: '#155724' },
  'Caution': { bg: '#fff3cd', color: '#856404' },
  'High Risk': { bg: '#f8d7da', color: '#721c24' },
  'Insufficient Data': { bg: '#e2e3e5', color: '#383d41' },
};

const STATUS_LABELS: Record<MerchantStatus, string> = {
  active: 'Active',
  under_review: 'Under Review',
  suspended: 'Suspended',
};

function Badge({ label, style }: { label: string; style: { bg: string; color: string } }) {
  return (
    <span style={{ ...styles.badge, backgroundColor: style.bg, color: style.color }}>
      {label}
    </span>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={styles.field}>
      <span style={styles.fieldLabel}>{label}</span>
      <span style={styles.fieldValue}>{value}</span>
    </div>
  );
}

export default function MerchantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [merchant, setMerchant] = useState<MerchantWithAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || id === 'new') {
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/api/merchants/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error(`API error: ${r.status}`);
        return r.json() as Promise<MerchantWithAssessment>;
      })
      .then((data) => {
        setMerchant(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load merchant');
        setLoading(false);
      });
  }, [id]);

  if (id === 'new') {
    return (
      <div>
        <Link to="/admin/merchants" style={styles.backLink}>← Back to Merchants</Link>
        <h2 style={styles.title}>Create Merchant</h2>
        <div style={styles.card}>
          <p style={styles.placeholder}>
            Merchant creation form — coming in a future sprint.
          </p>
        </div>
      </div>
    );
  }

  if (loading) return <p style={styles.message}>Loading merchant…</p>;
  if (error) return <p style={{ ...styles.message, color: '#d63031' }}>{error}</p>;
  if (!merchant) return <p style={styles.message}>Merchant not found.</p>;

  const latestAssessment = merchant.assessments[0];
  const redFlags: string[] = latestAssessment
    ? safeParseJSON(latestAssessment.redFlags)
    : [];
  const publicReasons: string[] = latestAssessment
    ? safeParseJSON(latestAssessment.publicReasons)
    : [];

  return (
    <div>
      <Link to="/admin/merchants" style={styles.backLink}>← Back to Merchants</Link>

      <div style={styles.pageHeader}>
        <h2 style={styles.title}>{merchant.name}</h2>
        <Badge
          label={merchant.currentVerdict}
          style={VERDICT_COLORS[merchant.currentVerdict] ?? { bg: '#eee', color: '#333' }}
        />
      </div>

      <div style={styles.grid}>
        {/* Merchant Details */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Merchant Details</h3>
          <Field label="Domain" value={merchant.domain} />
          <Field label="Category" value={merchant.category} />
          <Field
            label="Status"
            value={STATUS_LABELS[merchant.status] ?? merchant.status}
          />
          <Field
            label="Last Reviewed"
            value={
              merchant.lastReviewedAt
                ? new Date(merchant.lastReviewedAt).toLocaleDateString('en-AU')
                : '—'
            }
          />
          <Field label="Public Summary" value={merchant.publicSummary} />
        </div>

        {/* Latest Assessment */}
        {latestAssessment && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Latest Assessment</h3>
            <Field label="Transparency" value={latestAssessment.transparencyRating} />
            <Field label="Reliability" value={latestAssessment.reliabilityRating} />
            <Field label="Integrity" value={latestAssessment.integrityRating} />
            <Field label="Communication" value={latestAssessment.communicationRating} />
            <Field
              label="Reviewed At"
              value={new Date(latestAssessment.reviewedAt).toLocaleDateString('en-AU')}
            />
            {redFlags.length > 0 && (
              <div style={styles.field}>
                <span style={styles.fieldLabel}>Red Flags</span>
                <ul style={styles.list}>
                  {redFlags.map((flag, i) => (
                    <li key={i} style={styles.redFlagItem}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}
            {publicReasons.length > 0 && (
              <div style={styles.field}>
                <span style={styles.fieldLabel}>Public Reasons</span>
                <ul style={styles.list}>
                  {publicReasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
            <Field label="Internal Rationale" value={latestAssessment.internalRationale} />
          </div>
        )}

        {!latestAssessment && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Assessment</h3>
            <p style={styles.placeholder}>No assessment recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backLink: {
    display: 'inline-block',
    marginBottom: '16px',
    color: '#6c63ff',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  title: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 700,
    color: '#1a1a2e',
  },
  message: {
    color: '#444',
    fontSize: '14px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
    padding: '24px',
  },
  cardTitle: {
    margin: '0 0 16px',
    fontSize: '16px',
    fontWeight: 700,
    color: '#1a1a2e',
    borderBottom: '1px solid #f0f0f8',
    paddingBottom: '10px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    marginBottom: '14px',
  },
  fieldLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  fieldValue: {
    fontSize: '14px',
    color: '#222',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 600,
  },
  list: {
    margin: '4px 0 0 0',
    paddingLeft: '18px',
    fontSize: '14px',
    color: '#333',
  },
  redFlagItem: {
    color: '#721c24',
  },
  placeholder: {
    color: '#999',
    fontSize: '14px',
  },
};
