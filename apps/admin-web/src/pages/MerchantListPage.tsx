import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Merchant, Verdict, MerchantStatus } from '@rateit/shared-types';

const API_BASE = 'http://localhost:3001';

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

const STATUS_COLORS: Record<MerchantStatus, { bg: string; color: string }> = {
  active: { bg: '#d4edda', color: '#155724' },
  under_review: { bg: '#fff3cd', color: '#856404' },
  suspended: { bg: '#f8d7da', color: '#721c24' },
};

function Badge({ label, style }: { label: string; style: { bg: string; color: string } }) {
  return (
    <span style={{ ...styles.badge, backgroundColor: style.bg, color: style.color }}>
      {label}
    </span>
  );
}

export default function MerchantListPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/merchants`)
      .then((r) => {
        if (!r.ok) throw new Error(`API error: ${r.status}`);
        return r.json() as Promise<Merchant[]>;
      })
      .then((data) => {
        setMerchants(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load merchants');
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.title}>Merchants</h2>
        <Link to="/admin/merchants/new" style={styles.createButton}>
          + Create Merchant
        </Link>
      </div>

      {loading && <p style={styles.message}>Loading merchants…</p>}
      {error && <p style={{ ...styles.message, color: '#d63031' }}>{error}</p>}

      {!loading && !error && (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Domain</th>
                <th style={styles.th}>Verdict</th>
                <th style={styles.th}>Last Reviewed</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {merchants.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: '#999' }}>
                    No merchants found.
                  </td>
                </tr>
              ) : (
                merchants.map((m) => (
                  <tr key={m.id} style={styles.row}>
                    <td style={styles.td}>
                      <Link to={`/admin/merchants/${m.id}`} style={styles.nameLink}>
                        {m.name}
                      </Link>
                    </td>
                    <td style={{ ...styles.td, color: '#666' }}>{m.domain}</td>
                    <td style={styles.td}>
                      <Badge
                        label={m.currentVerdict}
                        style={VERDICT_COLORS[m.currentVerdict] ?? { bg: '#eee', color: '#333' }}
                      />
                    </td>
                    <td style={{ ...styles.td, color: '#666' }}>
                      {m.lastReviewedAt
                        ? new Date(m.lastReviewedAt).toLocaleDateString('en-AU')
                        : '—'}
                    </td>
                    <td style={styles.td}>
                      <Badge
                        label={STATUS_LABELS[m.status] ?? m.status}
                        style={STATUS_COLORS[m.status] ?? { bg: '#eee', color: '#333' }}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
  },
  title: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 700,
    color: '#1a1a2e',
  },
  createButton: {
    padding: '10px 20px',
    backgroundColor: '#6c63ff',
    color: '#fff',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '14px',
  },
  message: {
    color: '#444',
    fontSize: '14px',
  },
  tableWrapper: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left' as const,
    backgroundColor: '#f8f9fc',
    borderBottom: '2px solid #e0e0ea',
    fontWeight: 600,
    color: '#555',
    fontSize: '13px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  td: {
    padding: '13px 16px',
    borderBottom: '1px solid #f0f0f8',
    verticalAlign: 'middle' as const,
  },
  row: {
    transition: 'background-color 0.1s',
  },
  nameLink: {
    color: '#6c63ff',
    fontWeight: 600,
    textDecoration: 'none',
  },
  badge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
  },
};
