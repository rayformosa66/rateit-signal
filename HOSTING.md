# Hosting Guide

## Requirements

### HTTPS is mandatory

All three components **must** run over HTTPS in production:

- The **API** (`apps/api`) — required so the extension can make secure fetch calls and so admin sessions cannot be intercepted.
- The **admin dashboard** (`apps/admin-web`) — handles JWTs and admin credentials.
- The **browser extension** — Chrome and Firefox block mixed-content requests; the extension popup will fail silently if `VITE_API_BASE` points to an HTTP URL while the browser enforces HTTPS.

Use a reverse proxy (nginx, Caddy) or a platform that provisions TLS automatically (Railway, Render, Fly.io). Do not expose the Node HTTP server directly.

---

## Environment Variables

### `apps/api` — copy `.env.example` to `.env` and fill in all values

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Libsql connection string. Use `file:./dev.db` locally; use a hosted libsql/Turso URL in production. |
| `JWT_SECRET` | **Yes (prod)** | Random secret used to sign admin JWTs. Generate with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. The server **throws at startup** if this is missing in production. |
| `ALLOWED_ORIGINS` | **Yes (prod)** | Comma-separated list of allowed CORS origins, e.g. `https://admin.yourdomain.com`. Defaults to `*` (dev only). |
| `NODE_ENV` | Yes (prod) | Set to `production` to enable all production guards. |
| `PORT` | No | API listen port. Defaults to `3001`. |

### `apps/extension` — copy `.env.example` to `.env` before building

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE` | Yes | Full URL of the RateIt API, e.g. `https://api.yourdomain.com`. Set at **build time** — baked into the extension bundle. |

### Database seed (production only)

| Variable | Required | Description |
|---|---|---|
| `SEED_ADMIN_PASSWORD` | **Yes (prod)** | Password for the initial admin account. Must be set before running `prisma db seed` in production. The seed script **exits with an error** if this is missing when `NODE_ENV=production`. |

---

## First-Run Checklist

1. Set all required environment variables.
2. Run migrations: `pnpm exec prisma migrate deploy`
3. Seed the database: `SEED_ADMIN_PASSWORD=<strong-password> NODE_ENV=production pnpm exec prisma db seed`
4. Start the API: `node dist/server.js` (or your process manager of choice).
5. Build and deploy admin-web: `pnpm build` → serve `dist/` as a static site.
6. Build the extension: `VITE_API_BASE=https://api.yourdomain.com pnpm build` → load `dist/` as an unpacked extension, or submit to Chrome Web Store.

---

## Security Notes

- **Rotate `JWT_SECRET`** immediately if you suspect it has been exposed. All existing sessions will be invalidated.
- **Change the seed admin password** after first login.
- The login endpoint is rate-limited to 10 attempts per IP per 15 minutes.
- `reviewedBy` on every assessment stores the `AdminUser.id` of the authenticated reviewer — not a placeholder.
