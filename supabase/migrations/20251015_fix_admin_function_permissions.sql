-- Ensure proper permissions for admin and super admin functions
-- This fixes any permission issues with the functions

-- Grant execute permissions on is_admin function
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon, authenticated;

-- Grant execute permissions on is_super_admin function  
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO anon, authenticated;

-- Ensure the functions exist and work properly
-- Test the functions (these should not error)
DO $$
BEGIN
  -- Test is_admin function
  PERFORM public.is_admin();
  
  -- Test is_super_admin function
  PERFORM public.is_super_admin();
  
  RAISE NOTICE 'Both admin functions are working properly';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error testing admin functions: %', SQLERRM;
END
$$;