import { Link } from 'react-router-dom';
import { MOCK_MERCHANTS } from '../data/merchants';
import type { Merchant } from '@rateit/shared-types';

type Verdict = Merchant['currentVerdict'];
type Status = Merchant['status'];

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function MerchantListPage() {
  return (
    <>
      <div className="page-header">
        <h1>Merchants</h1>
        <Link to="/merchants/new" className="btn btn-primary">
          + Create Merchant
        </Link>
      </div>

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
            {MOCK_MERCHANTS.map((merchant) => (
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
    </>
  );
}

export default MerchantListPage;
