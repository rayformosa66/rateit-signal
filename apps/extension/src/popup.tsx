import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import type { Verdict, MerchantLookupResponse } from '@rateit/shared-types';
import './popup.css';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3001';

type AppState =
  | { status: 'loading' }
  | { status: 'found'; data: MerchantLookupResponse }
  | { status: 'not_found'; domain: string }
  | { status: 'error'; message: string };

function getDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

const VERDICT_CONFIG: Record<Verdict, { label: string; className: string; icon: string }> = {
  'Trusted':            { label: 'Trusted',            className: 'verdict-trusted',      icon: '✓' },
  'Caution':            { label: 'Caution',            className: 'verdict-caution',      icon: '!' },
  'High Risk':          { label: 'High Risk',          className: 'verdict-high-risk',    icon: '✕' },
  'Insufficient Data':  { label: 'Insufficient Data',  className: 'verdict-insufficient', icon: '?' },
};

function LoadingPanel() {
  return (
    <div className="popup-body">
      <div className="status-message loading-message">Checking site…</div>
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="popup-body">
      <div className="status-message error-message">{message}</div>
    </div>
  );
}

function NotFoundPanel({ domain }: { domain: string }) {
  return (
    <div className="popup-body">
      <div className="domain-label">{domain}</div>
      <div className="verdict-panel verdict-insufficient">
        <span className="verdict-icon" aria-hidden="true">?</span>
        <div>
          <div className="verdict-label">Insufficient Data</div>
          <div className="verdict-name">No reviews yet</div>
        </div>
      </div>
      <p className="not-found-prompt">
        We don't have data for this site yet. Submit a report to help the community.
      </p>
    </div>
  );
}

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
            {data.topReasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {reviewedDate && (
        <div className="reviewed-date">Last reviewed: {reviewedDate}</div>
      )}
    </div>
  );
}

function App() {
  const [state, setState] = useState<AppState>({ status: 'loading' });

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url;
      if (!url) {
        setState({ status: 'error', message: 'Could not determine the current tab URL.' });
        return;
      }

      const domain = getDomain(url);
      if (!domain) {
        setState({ status: 'error', message: 'Not a valid web page.' });
        return;
      }

      fetch(`${API_BASE}/v1/lookup?domain=${encodeURIComponent(domain)}`)
        .then((response) => {
          if (response.status === 404) {
            setState({ status: 'not_found', domain });
            return;
          }
          if (!response.ok) {
            setState({ status: 'error', message: `API error (${response.status})` });
            return;
          }
          return response.json().then((data: MerchantLookupResponse) => {
            setState({ status: 'found', data });
          });
        })
        .catch(() => {
          setState({ status: 'error', message: 'Could not connect to the RateIt API.' });
        });
    });
  }, []);

  return (
    <div className="popup-root">
      <header className="popup-header">
        <span className="header-icon" aria-hidden="true">🛡</span>
        <span className="header-title">RateIt Signal</span>
      </header>
      {state.status === 'loading'   && <LoadingPanel />}
      {state.status === 'found'     && <VerdictPanel data={state.data} />}
      {state.status === 'not_found' && <NotFoundPanel domain={state.domain} />}
      {state.status === 'error'     && <ErrorPanel message={state.message} />}
    </div>
  );
}

const rootEl = document.getElementById('root')!;
ReactDOM.createRoot(rootEl).render(<App />);
