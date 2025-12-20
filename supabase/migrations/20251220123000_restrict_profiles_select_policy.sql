-- Ensure only the profile owner or admins can SELECT from public.profiles
-- This prevents other authenticated users from reading names/phone numbers.

-- Create explicit restrictive SELECT policy
DROP POLICY IF EXISTS "Only owner or admin can select profiles" ON public.profiles;
CREATE POLICY "Only owner or admin can select profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR user_id = auth.uid()
);

-- Optional: Deny anonymous access by ensuring no policy allows anon
-- (RLS defaults to deny unless a policy permits; this is informational.)
