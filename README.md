# Julin — Real Estate Hub

A small, fast real-estate frontend built with Vite, React, TypeScript and Supabase.

## Overview

This project showcases property listings, search, and an AI-powered chat assistant to help users discover properties and answer questions.

## Notable features

- Property search and filters
- Admin dashboard and analytics
- AI chat assistant with:
  - Realtime notifications (optional; enable via `VITE_ENABLE_REALTIME=true`)
  - Pulse-style unread indicator
  - Sound toggle for notifications
  - Unread state persisted in localStorage
  - Auto-open on first visit

## Development

- Node + Bun + Vite for local development
- Supabase for backend and realtime features


---

If you'd like a more detailed README (badges, deploy instructions, or contribution notes), tell me what to include and I'll expand it.

## CI & Secrets

- Local development: keep a `.env` file (gitignored) with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for convenience.
- Production & CI: store secrets in your deployment provider or GitHub Actions secrets (do NOT commit service-role keys or secrets to the repo).
- Required CI secrets for GitHub Pages workflow:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`

If any service-role key (privileged) was committed previously, rotate it immediately.

## Chat & Supabase Edge Functions 🔧

The AI chat uses Supabase Edge Functions and requires additional environment variables and configuration when deployed:

- Required (on the Edge Function environment):
  - `SUPABASE_URL` — your Supabase project URL
  - `SUPABASE_SERVICE_ROLE_KEY` — service role key (store securely in function settings; do NOT commit)
- Optional/AI-related:
  - `OPENAI_API_KEY` or `LOVABLE_API_KEY` — AI provider API key (used by the chat function)
  - `GREETING_PATTERNS_JSON` or `GREETING_LOCALE` — used to customize greeting detection

Security & RLS:

- Apply the migration `supabase/migrations/20251219093000_restrict_chat_policies.sql` to tighten RLS on `chat_conversations` and `chat_messages` (see `supabase/SECURITY_FIX_CHAT_POLICIES.md`).
- Ensure your frontend uses the publishable key for Edge Function calls (the app includes `apikey` and `Authorization` headers when calling functions).

If you need, I can add deployment steps showing how to set these environment variables and run the migration in Supabase.