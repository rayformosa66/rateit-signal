import { useState, useEffect } from 'react';
import { authHeaders } from '../lib/auth';

type ReportStatus = 'new' | 'under_review' | 'resolved';

interface Report {
  id: string;
  domain: string;
  merchantName: string | null;
  reportType: string;
  description: string;
  status: ReportStatus;
  createdAt: string;
}

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'New', value: 'new' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Resolved', value: 'resolved' },
];

function statusBadge(status: ReportStatus) {
  const map: Record<ReportStatus, string> = {
    new: 'badge badge-high-risk',
    under_review: 'badge badge-under-review',
    resolved: 'badge badge-active',
  };
  const label: Record<ReportStatus, string> = {
    new: 'New',
    under_review: 'Under Review',
    resolved: 'Resolved',
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

function formatType(t: string) {
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  async function loadReports(filter: string) {
    setLoading(true);
    setError(null);
    try {
      const url = filter ? `/api/reports?status=${filter}` : '/api/reports';
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      setReports((await res.json()) as Report[]);
    } catch {
      setError('Could not load reports. Ensure the API is running on port 3001.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadReports(statusFilter); }, [statusFilter]);

  async function updateStatus(id: string, status: ReportStatus) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    } catch {
      alert('Failed to update report status.');
    } finally {
      setUpdating(null);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Shopper Reports</h1>
        <div className="filter-tabs">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              className={`filter-tab${statusFilter === f.value ? ' filter-tab-active' : ''}`}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
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
                <th>Domain</th>
                <th>Merchant</th>
                <th>Type</th>
                <th>Description</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#888' }}>
                    No reports found.
                  </td>
                </tr>
              )}
              {reports.map((r) => (
                <tr key={r.id}>
                  <td><code style={{ fontSize: 12 }}>{r.domain}</code></td>
                  <td>{r.merchantName ?? <span style={{ color: '#aaa' }}>—</span>}</td>
                  <td>{formatType(r.reportType)}</td>
                  <td>
                    <span
                      title={r.description}
                      style={{ display: 'block', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {r.description}
                    </span>
                  </td>
                  <td>{statusBadge(r.status)}</td>
                  <td>{formatDate(r.createdAt)}</td>
                  <td>
                    <div className="report-actions">
                      {r.status === 'new' && (
                        <button
                          className="btn-action"
                          disabled={updating === r.id}
                          onClick={() => updateStatus(r.id, 'under_review')}
                        >
                          Review
                        </button>
                      )}
                      {r.status !== 'resolved' && (
                        <button
                          className="btn-action btn-action-resolve"
                          disabled={updating === r.id}
                          onClick={() => updateStatus(r.id, 'resolved')}
                        >
                          Resolve
                        </button>
                      )}
                      {r.status === 'resolved' && (
                        <span style={{ color: '#aaa', fontSize: 12 }}>Done</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default ReportsPage;
