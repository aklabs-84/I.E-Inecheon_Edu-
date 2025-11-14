-- Create a test to verify RLS is working correctly
-- First, let's create a temporary test user context function
CREATE OR REPLACE FUNCTION test_unauthenticated_access()
RETURNS TABLE(test_result text, record_count bigint)
LANGUAGE plpgsql
SECURITY INVOKER -- Important: uses caller's permissions, not definer's
AS $$
BEGIN
  -- This should return 0 records if RLS is working
  RETURN QUERY
  SELECT 
    'Unauthenticated profiles access test' as test_result,
    COUNT(*) as record_count
  FROM profiles;
END;
$$;

-- Test the function
SELECT * FROM test_unauthenticated_access();

-- Clean up
DROP FUNCTION test_unauthenticated_access();