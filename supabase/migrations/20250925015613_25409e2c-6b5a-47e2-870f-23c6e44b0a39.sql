-- ULTIMATE FIX: Ensure anon role has absolutely no access to profiles
-- The issue might be that anon role still has some residual permissions

-- Completely revoke ALL permissions from anon role
REVOKE ALL PRIVILEGES ON public.profiles FROM anon;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;

-- Make sure anon role cannot even see the table structure
REVOKE USAGE ON SCHEMA public FROM anon;
GRANT USAGE ON SCHEMA public TO anon; -- But only basic usage, not table access

-- Ensure no policies exist for anon role on profiles
-- (our policies are all for authenticated role only)

-- Verify current permissions
SELECT 
  grantee, 
  privilege_type, 
  is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY grantee, privilege_type;