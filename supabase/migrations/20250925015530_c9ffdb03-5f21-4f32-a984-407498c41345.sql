-- Fix the circular dependency in admin profile access policy
-- Replace the admin policy with one that uses the existing security definer functions

DROP POLICY IF EXISTS "profiles_authenticated_select_admin" ON public.profiles;

-- Create admin policy using existing security definer functions to avoid circular dependency
CREATE POLICY "profiles_authenticated_select_admin" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND (is_admin() OR is_super_admin())
);

-- Test the security fix
CREATE OR REPLACE FUNCTION test_profiles_security()
RETURNS TABLE(test_name text, should_be_zero bigint)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Unauthenticated access test (should be 0)' as test_name,
    COUNT(*) as should_be_zero
  FROM profiles;
END;
$$;

-- Run the test
SELECT * FROM test_profiles_security();

-- Clean up test function
DROP FUNCTION test_profiles_security();