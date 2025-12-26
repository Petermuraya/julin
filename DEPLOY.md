# Deployment Guide — Julin Real Estate Hub

This file documents a minimal, one-file deployment checklist: CI steps, secrets to configure, Supabase migrations & functions, and optional admin server deployment.

---

## 1. Overview

- Frontend: Vite + React + TypeScript app (build with `npm run build`).
- Backend: Supabase (DB, Storage, Edge Functions). An optional Node Express proxy (`server/index.mjs`) is provided for admin uploads and server-side actions requiring the Supabase service role key.

---

## 2. Required secrets (store in CI/hosting & Supabase settings)

- `VITE_SUPABASE_URL` — Supabase project URL (used by frontend).
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/public key (frontend).
- `SUPABASE_URL` — Supabase project URL (Edge functions / server).
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service-role key (server or admin tasks). KEEP PRIVATE.
- `OPENAI_API_KEY` or `LOVABLE_API_KEY` — AI provider key for chat Edge Function.
- `MAPBOX_PUBLIC_TOKEN` — Mapbox public token used by Edge Function `get-mapbox-token`.
- Optional rate-limit envs for contact function:
  - `CONTACT_RATE_LIMIT_WINDOW_MINUTES`
  - `CONTACT_RATE_LIMIT_MAX`
- GitHub/GH Pages deploy: `GH_TOKEN` or `ACTIONS_DEPLOY_KEY` (if using `gh-pages` or similar).

Security: Never commit `SUPABASE_SERVICE_ROLE_KEY` or other privileged keys. Use platform secret storage.

---

## 3. Quick local run

Install deps and run frontend dev server:

```bash
npm ci
npm run dev
```

Start the optional admin server (requires service role key):

```bash
# Windows (PowerShell)
$env:SUPABASE_URL = "https://<project>.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "<service-role-key>"
npm run start:server
```

If developing Supabase Edge Functions locally, use the `supabase` CLI:

```bash
supabase login
supabase link --project-ref <PROJECT_REF>
supabase functions serve
```

---

## 4. Frontend CI (GitHub Actions example)

- Purpose: install, build, and deploy the static site (works with `gh-pages`, Netlify, Vercel, etc.).
- Configure repository secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `GH_TOKEN` (if using `gh-pages`).

Example minimal workflow (paste into `.github/workflows/deploy.yml`):

```yaml
name: Build and Deploy
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
      - run: npm run deploy    # uses `gh-pages` if configured in package.json
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
```

Adjust the deploy step for Netlify/Vercel or other hosts (upload `dist/` or let platform run the build).

---

## 5. Supabase — migrations & Edge Functions

Prereq: `supabase` CLI installed and authenticated (`supabase login`).

Apply SQL migrations from `supabase/migrations/` (either via CLI or Supabase UI). Critical migration: the chat policies migration to tighten RLS.

CLI examples:

```bash
# Link your project (one-time)
supabase link --project-ref <PROJECT_REF>

# Apply migrations (if using `supabase db push` workflow)
supabase db push --project-ref <PROJECT_REF>

# Or run SQL from files using the UI or API
```

Deploy Edge Functions:

```bash
supabase functions deploy chat --project-ref <PROJECT_REF>
supabase functions deploy get-mapbox-token --project-ref <PROJECT_REF>
supabase functions deploy get-properties --project-ref <PROJECT_REF>
supabase functions deploy submit-contact --project-ref <PROJECT_REF>
```

Set function secrets (on Supabase dashboard or via CLI):

```bash
supabase secrets set OPENAI_API_KEY="<...>" LOVABLE_API_KEY="<...>" MAPBOX_PUBLIC_TOKEN="<...>" --project-ref <PROJECT_REF>
```

Verify one function:

```bash
curl -X POST "https://<project>.functions.supabase.co/chat" -H "Content-Type: application/json" -d '{"message":"hello"}'
```

Expected: JSON with `reply` (or helpful fallback if AI key is missing).

---

## 6. Optional: Admin Node proxy server

The `server/index.mjs` Express app is intended for admin-only tasks (file uploads to Supabase Storage, admin property insertion, and server-side DB writes using service-role key).

- Host on a trusted server (VPS, Fly, Heroku, etc.).
- Environment variables required:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `PORT` (optional; defaults to 8787)

Example run:

```bash
# Linux / macOS
SUPABASE_URL="https://<project>.supabase.co" SUPABASE_SERVICE_ROLE_KEY="<service-key>" node server/index.mjs
```

Security notes:
- Restrict access to the admin server via firewall, VPN, or auth proxy. Do not expose it publicly without additional access controls.

---

## 7. Post-deploy checklist

- Confirm frontend can read properties: call `supabase/functions/get-properties` or open the site and verify listings load.
- Confirm chat Edge Function returns replies when `OPENAI_API_KEY`/`LOVABLE_API_KEY` set.
- Confirm `server/index.mjs` (if used) can upload files to your Supabase Storage bucket.
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is NOT present in any built frontend assets.

---

## 8. Troubleshooting

- 500 on Edge Function: check function logs in Supabase, verify required env vars.
- Missing properties: check `properties` table rows and `status` column.
- Upload failures: confirm Storage bucket `properties` exists and service-role key has permissions.

---

## 9. Contact

If you want, I can also add a ready-to-use `.github/workflows/deploy.yml` to the repo, or create a small `systemd`/Procfile for hosting the admin server. Request which one and I'll add it.
