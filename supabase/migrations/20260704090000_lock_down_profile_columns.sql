-- Security fix: prevent privilege escalation via profiles.
--
-- The profiles UPDATE policy is row-level ("update your own row") but has no
-- column-level restriction, so an authenticated user could set is_admin = true
-- on their own row by calling the REST API directly with the public anon key —
-- bypassing the app UI entirely — and gain full policy-library admin.
--
-- Postgres RLS can't express "column X must keep its previous value" (WITH CHECK
-- sees only the new row), so restrict writable columns with column-level grants.
-- Admins are provisioned out-of-band via the SQL editor / service role, which is
-- not subject to these grants. updated_at is maintained by a SECURITY DEFINER
-- trigger, so it does not need to be granted to the caller.

revoke update on public.profiles from authenticated;

grant update (full_name, phone) on public.profiles to authenticated;
