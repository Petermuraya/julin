What changed

- Dropped overly-permissive RLS policies on `chat_conversations` and `chat_messages`.
- Added stricter policies so that only admins and conversation owners can SELECT/UPDATE rows. Anonymous users can still INSERT so visitors can use the chat.
- Added guidance to record `user_email` on conversation creation so RLS can verify ownership.

How to apply

1. Apply the migration to your Supabase database (recommended via supabase CLI or the SQL editor):
   - Open the SQL editor in Supabase and run the file `supabase/migrations/20251219093000_restrict_chat_policies.sql`.
   - Or run the migration using your normal migration tooling.

2. Verify as an anonymous (anon) user -- SELECTs should be rejected; INSERTs should still work.
3. Verify as an authenticated user -- you should be able to SELECT your own conversations (where `user_email` matches your JWT email).
4. Verify as an admin -- you should be able to see all conversation/message rows.

Frontend changes

- Added an `AuthContext` at `src/contexts/AuthContext.tsx` and integrated it in `src/main.tsx`.
- `Chat` component now records `user_email` on conversation creation when available and obtains user/admin state from `useAuth`.

Notes & follow-ups

- Consider adding an explicit `owner_id UUID` column or signed session token in a follow-up migration. This provides a stronger guarantee than matching `user_email`.
- If chat data was public, consider an incident check (access logs) and a notification plan if needed.
