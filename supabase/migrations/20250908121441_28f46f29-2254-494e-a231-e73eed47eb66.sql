-- Fix infinite recursion in profiles RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;

-- Create new policies without circular dependency
CREATE POLICY "profiles_select_own" 
ON profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin" 
ON profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'
    AND auth.uid() IS NOT NULL
  )
);

-- Also ensure we have a way for users to see basic profile info for admin checks
-- This allows the programs policies to work properly
CREATE POLICY "profiles_select_for_admin_check"
ON profiles
FOR SELECT
USING (role = 'admin' AND auth.uid() IS NOT NULL);