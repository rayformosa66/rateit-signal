import ReactDOM from 'react-dom/client';
import type { Verdict, MerchantLookupResponse } from '@rateit/shared-types';
import './popup.css';

const MOCK_DATA: MerchantLookupResponse = {
  domain: 'example-store.com',
  name: 'Example Store',
  verdict: 'Trusted',
  lastReviewedAt: '2026-03-15T00:00:00.000Z',
  pillarSnapshot: {
    transparency: 'Strong',
    reliability: 'Strong',
    integrity: 'Strong',
    communication: 'Mixed',
  },
  publicSummary: 'This merchant has a strong track record of reliable service.',
  topReasons: [
    'Clear and accessible returns policy',
    'Consistent on-time delivery',
    'Responsive customer support team',
  ],
};

const VERDICT_CONFIG: Record<Verdict, { label: string; className: string; icon: string }> = {
  'Trusted':            { label: 'Trusted',            className: 'verdict-trusted',      icon: '✓' },
  'Caution':            { label: 'Caution',            className: 'verdict-caution',      icon: '!' },
  'High Risk':          { label: 'High Risk',          className: 'verdict-high-risk',    icon: '✕' },
  'Insufficient Data':  { label: 'Insufficient Data',  className: 'verdict-insufficient', icon: '?' },
};

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
  return (
    <div className="popup-root">
      <header className="popup-header">
        <span className="header-icon" aria-hidden="true">🛡</span>
        <span className="header-title">RateIt Signal</span>
      </header>
      <VerdictPanel data={MOCK_DATA} />
    </div>
  );
}

const rootEl = document.getElementById('root')!;
ReactDOM.createRoot(rootEl).render(<App />);
