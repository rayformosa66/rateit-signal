import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Merchant } from '@rateit/shared-types';

type Verdict = Merchant['currentVerdict'];
type Status = Merchant['status'];

interface MerchantRow {
  id: string;
  name: string;
  domain: string;
  currentVerdict: Verdict;
  lastReviewedAt: string | null;
  status: Status;
}

function verdictBadge(verdict: Verdict) {
  const map: Record<Verdict, string> = {
    Trusted: 'badge badge-trusted',
    Caution: 'badge badge-caution',
    'High Risk': 'badge badge-high-risk',
    'Insufficient Data': 'badge badge-insufficient',
  };
  return <span className={map[verdict]}>{verdict}</span>;
}

function statusBadge(status: Status) {
  const map: Record<Status, string> = {
    active: 'badge badge-active',
    under_review: 'badge badge-under-review',
    suspended: 'badge badge-suspended',
  };
  const label: Record<Status, string> = {
    active: 'Active',
    under_review: 'Under Review',
    suspended: 'Suspended',
  };
  return <span className={map[status]}>{label[status]}</span>;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function MerchantListPage() {
  const [merchants, setMerchants] = useState<MerchantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/merchants')
      .then((res) => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        return res.json() as Promise<MerchantRow[]>;
      })
      .then((data) => {
        setMerchants(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load merchants. Ensure the API is running on port 3001.');
        setLoading(false);
      });
  }, []);

  return (
    <>
      <div className="page-header">
        <h1>Merchants</h1>
        <Link to="/merchants/new" className="btn btn-primary">
          + Create Merchant
        </Link>
      </div>

      {loading && <p style={{ color: '#666', marginTop: 8 }}>Loading…</p>}

      {error && (
        <div className="save-error" role="alert" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Domain</th>
                <th>Verdict</th>
                <th>Last Reviewed</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {merchants.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>
                    No merchants yet. <Link to="/merchants/new">Create one.</Link>
                  </td>
                </tr>
              )}
              {merchants.map((merchant) => (
                <tr key={merchant.id}>
                  <td>
                    <Link to={`/merchants/${merchant.id}`}>{merchant.name}</Link>
                  </td>
                  <td>{merchant.domain}</td>
                  <td>{verdictBadge(merchant.currentVerdict)}</td>
                  <td>{formatDate(merchant.lastReviewedAt)}</td>
                  <td>{statusBadge(merchant.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default MerchantListPage;
