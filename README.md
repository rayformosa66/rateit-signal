# rateit-signal

RateIt Signal MVP — a human-reviewed trust signal delivered through a browser extension.

## Monorepo Structure

```
rateit-signal/
├── apps/
│   ├── api/          — REST API serving merchant verdicts and accepting user reports
│   ├── admin-web/    — Admin dashboard for merchant assessments and report moderation
│   └── extension/    — Chrome extension popup displaying trust verdicts to shoppers
└── packages/
    ├── shared-types/ — Shared TypeScript types (Verdict, PillarRating, Merchant, …)
    └── verdict-engine/ — Deterministic rules engine converting pillar ratings to verdicts
```

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm v7 or higher (ships with Node 16+)

## Install

From the repository root, install all workspace dependencies in one command:

```bash
npm install
```

## Type-check

Compile all packages in dependency order — this also validates all TypeScript types:

```bash
npm run build
```

## Build

Compile all packages to `dist/` (same as type-check — the TypeScript project references handle ordering automatically):

```bash
npm run build
```

To remove all compiled output:

```bash
npm run clean
```

## Packages

### `@rateit/shared-types`

Core TypeScript types shared across every app and package:

| Export | Description |
|---|---|
| `Verdict` | `'Trusted' \| 'Caution' \| 'High Risk' \| 'Insufficient Data'` |
| `PillarRating` | `'Strong' \| 'Mixed' \| 'Weak' \| 'Unknown'` |
| `MerchantStatus` | `'active' \| 'under_review' \| 'suspended'` |
| `ReportStatus` | `'new' \| 'under_review' \| 'resolved'` |
| `Merchant` | Reviewed merchant record |
| `Assessment` | Trust assessment completed by an internal reviewer |
| `UserReport` | Report submitted by a shopper |
| `PillarSnapshot` | Four-pillar rating snapshot for API responses |
| `MerchantLookupResponse` | Response shape for the `/merchant-by-domain` endpoint |

### `@rateit/verdict-engine`

Deterministic rules engine that converts pillar ratings and red flags into a final verdict. Implementation is delivered in Issue #3.

