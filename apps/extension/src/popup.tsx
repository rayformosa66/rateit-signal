import ReactDOM from 'react-dom/client';
import { useEffect, useState } from 'react';
import type { Verdict, MerchantLookupResponse } from '@rateit/shared-types';
import './popup.css';

const API_BASE = 'http://localhost:3001';

const VERDICT_CONFIG: Record<Verdict, { label: string; className: string; icon: string }> = {
  Trusted: { label: 'Trusted', className: 'verdict-trusted', icon: '✓' },
  Caution: { label: 'Caution', className: 'verdict-caution', icon: '!' },
  'High Risk': { label: 'High Risk', className: 'verdict-high-risk', icon: '✕' },
  'Insufficient Data': { label: 'Insufficient Data', className: 'verdict-insufficient', icon: '?' },
};

function buildInsufficient(domain: string): MerchantLookupResponse {
  return {
    domain,
    name: 'Unknown merchant',
    verdict: 'Insufficient Data',
    lastReviewedAt: null,
    pillarSnapshot: {
      transparency: 'Unknown',
      reliability: 'Unknown',
      integrity: 'Unknown',
      communication: 'Unknown',
    },
    publicSummary: 'No rating is available for this site yet.',
    topReasons: [],
  };
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
        <span className="verdict-icon" aria-hidden="true">
          {config.icon}
        </span>
        <div>
          <div className="verdict-label">{config.label}</div>
          <div className="verdict-name">{data.name}</div>
        </div>
      </div>

      {data.publicSummary && (
        <div className="reasons-section">
          <div className="reasons-heading">Summary</div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>{data.publicSummary}</div>
        </div>
      )}

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

      {reviewedDate && <div className="reviewed-date">Last reviewed: {reviewedDate}</div>}

      {data.verdict === 'Insufficient Data' && (
        <div className="reviewed-date" style={{ marginTop: 8 }}>
          No data yet. (Report submission coming soon)
        </div>
      )}
    </div>
  );
}

async function getActiveTabDomain(): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c: any = (globalThis as any).chrome;

      if (!c?.tabs?.query) return resolve(null);

      c.tabs.query({ active: true, currentWindow: true }, (tabs: Array<{ url?: string }>) => {
        const url = tabs?.[0]?.url;
        if (!url) return resolve(null);

        try {
          const u = new URL(url);
          resolve(u.hostname);
        } catch {
          resolve(null);
        }
      });
    } catch {
      resolve(null);
    }
  });
}

async function lookupDomain(domain: string): Promise<MerchantLookupResponse | null> {
  const res = await fetch(`${API_BASE}/v1/lookup?domain=${encodeURIComponent(domain)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API error (${res.status})`);
  return (await res.json()) as MerchantLookupResponse;
}

type ScreenState =
  | { kind: 'loading' }
  | { kind: 'success'; data: MerchantLookupResponse }
  | { kind: 'notfound'; domain: string }
  | { kind: 'error'; message: string };

function App() {
  const [state, setState] = useState<ScreenState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setState({ kind: 'loading' });

        const domain = await getActiveTabDomain();
        if (cancelled) return;

        if (!domain) {
          setState({ kind: 'notfound', domain: 'unknown-site' });
          return;
        }

        const found = await lookupDomain(domain.toLowerCase());
        if (cancelled) return;

        if (!found) {
          setState({ kind: 'notfound', domain });
          return;
        }

        setState({ kind: 'success', data: found });
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : 'Unknown error';
        setState({ kind: 'error', message: msg });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="popup-root">
      <header className="popup-header">
        <span className="header-icon" aria-hidden="true">
          🛡
        </span>
        <span className="header-title">RateIt Signal</span>
      </header>

      {state.kind === 'loading' && (
        <div className="popup-body">
          <div className="domain-label">Checking site…</div>
          <div className="reviewed-date">Contacting RateIt API…</div>
        </div>
      )}

      {state.kind === 'error' && (
        <div className="popup-body">
          <div className="domain-label">Error</div>
          <div className="reviewed-date">{state.message}</div>
          <div className="reviewed-date" style={{ marginTop: 8 }}>
            (Is the API running on {API_BASE}?)
          </div>
        </div>
      )}

      {state.kind === 'notfound' && <VerdictPanel data={buildInsufficient(state.domain)} />}

      {state.kind === 'success' && <VerdictPanel data={state.data} />}
    </div>
  );
}

const rootEl = document.getElementById('root')!;
ReactDOM.createRoot(rootEl).render(<App />);
