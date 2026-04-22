import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import type { Verdict, MerchantLookupResponse } from '@rateit/shared-types';
import './popup.css';

const API_BASE = 'http://localhost:3001';

const REPORT_TYPES = [
  { value: 'non_delivery', label: 'Item not delivered' },
  { value: 'misleading_listing', label: 'Misleading product listing' },
  { value: 'no_refund', label: 'Refused refund / return' },
  { value: 'fake_reviews', label: 'Fake or manipulated reviews' },
  { value: 'other', label: 'Other concern' },
];

const VERDICT_CONFIG: Record<Verdict, { label: string; className: string; icon: string }> = {
  'Trusted':            { label: 'Trusted',            className: 'verdict-trusted',      icon: '✓' },
  'Caution':            { label: 'Caution',            className: 'verdict-caution',      icon: '!' },
  'High Risk':          { label: 'High Risk',          className: 'verdict-high-risk',    icon: '✕' },
  'Insufficient Data':  { label: 'Insufficient Data',  className: 'verdict-insufficient', icon: '?' },
};

// ---------------------------------------------------------------------------
// Report form
// ---------------------------------------------------------------------------

type ReportState = 'idle' | 'open' | 'submitting' | 'success' | 'error';

function ReportButton({ domain }: { domain: string }) {
  const [reportState, setReportState] = useState<ReportState>('idle');
  const [reportType, setReportType] = useState(REPORT_TYPES[0].value);
  const [description, setDescription] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setReportState('submitting');
    try {
      const res = await fetch(`${API_BASE}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, reportType, description: description.trim() }),
      });
      setReportState(res.ok ? 'success' : 'error');
    } catch {
      setReportState('error');
    }
  }

  if (reportState === 'success') {
    return (
      <div className="report-success">
        Thank you — your report has been submitted.
      </div>
    );
  }

  if (reportState === 'error') {
    return (
      <div className="report-error">
        Could not submit report. Try again later.
      </div>
    );
  }

  if (reportState === 'idle') {
    return (
      <button className="report-link" onClick={() => setReportState('open')}>
        Report this store
      </button>
    );
  }

  return (
    <form className="report-form" onSubmit={handleSubmit}>
      <div className="report-form-title">Report this store</div>

      <select
        className="report-select"
        value={reportType}
        onChange={(e) => setReportType(e.target.value)}
      >
        {REPORT_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      <textarea
        className="report-textarea"
        placeholder="Describe what happened…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        required
      />

      <div className="report-form-actions">
        <button
          type="button"
          className="report-cancel"
          onClick={() => setReportState('idle')}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="report-submit"
          disabled={reportState === 'submitting' || !description.trim()}
        >
          {reportState === 'submitting' ? 'Submitting…' : 'Submit'}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Verdict panels
// ---------------------------------------------------------------------------

function VerdictPanel({ data }: { data: MerchantLookupResponse }) {
  const config = VERDICT_CONFIG[data.verdict];
  const reviewedDate = data.lastReviewedAt
    ? new Date(data.lastReviewedAt).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="popup-body">
      <div className="domain-label">{data.domain}</div>

      <div className={`verdict-panel ${config.className}`}>
        <span className="verdict-icon" aria-hidden="true">{config.icon}</span>
        <div>
          <div className="verdict-label">{config.label}</div>
          <div className="verdict-name">{data.name}</div>
        </div>
      </div>

      {data.topReasons.length > 0 && (
        <div className="reasons-section">
          <div className="reasons-heading">Why this verdict</div>
          <ul className="reasons-list">
            {data.topReasons.map((reason: string, i: number) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {reviewedDate && (
        <div className="reviewed-date">Last reviewed: {reviewedDate}</div>
      )}

      <ReportButton domain={data.domain} />
    </div>
  );
}

function NoDataPanel({ domain }: { domain: string }) {
  return (
    <div className="popup-body">
      <div className="domain-label">{domain}</div>
      <div className="verdict-panel verdict-insufficient">
        <span className="verdict-icon" aria-hidden="true">?</span>
        <div>
          <div className="verdict-label">Not Reviewed</div>
          <div className="verdict-name">No data for this merchant</div>
        </div>
      </div>
      <p className="status-message">This merchant has not been reviewed yet.</p>
      <ReportButton domain={domain} />
    </div>
  );
}

function StatusMessage({ message }: { message: string }) {
  return (
    <div className="popup-body">
      <p className="status-message">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

type State =
  | { phase: 'loading' }
  | { phase: 'no-domain' }
  | { phase: 'not-found'; domain: string }
  | { phase: 'error'; message: string }
  | { phase: 'done'; data: MerchantLookupResponse };

function App() {
  const [state, setState] = useState<State>({ phase: 'loading' });

  useEffect(() => {
    async function load() {
      let domain: string | undefined;

      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tab?.url;
        if (!url || !url.startsWith('http')) {
          setState({ phase: 'no-domain' });
          return;
        }
        domain = new URL(url).hostname.replace(/^www\./, '');
      } catch {
        setState({ phase: 'error', message: 'Could not detect the current page.' });
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/merchants/by-domain/${encodeURIComponent(domain)}`);
        if (res.status === 404) {
          setState({ phase: 'not-found', domain });
          return;
        }
        if (!res.ok) {
          setState({ phase: 'error', message: `API error ${res.status}` });
          return;
        }
        const data = (await res.json()) as MerchantLookupResponse;
        setState({ phase: 'done', data });
      } catch {
        setState({ phase: 'error', message: 'Could not reach the RateIt API.' });
      }
    }

    load();
  }, []);

  return (
    <div className="popup-root">
      <header className="popup-header">
        <span className="header-icon" aria-hidden="true">🛡</span>
        <span className="header-title">RateIt Signal</span>
      </header>

      {state.phase === 'loading'    && <StatusMessage message="Checking merchant…" />}
      {state.phase === 'no-domain'  && <StatusMessage message="Open a shopping site to see its trust rating." />}
      {state.phase === 'error'      && <StatusMessage message={state.message} />}
      {state.phase === 'not-found'  && <NoDataPanel domain={state.domain} />}
      {state.phase === 'done'       && <VerdictPanel data={state.data} />}
    </div>
  );
}

const rootEl = document.getElementById('root')!;
ReactDOM.createRoot(rootEl).render(<App />);
