-- Drop existing admin select policy and create new one that includes super admin access
DROP POLICY IF EXISTS "profiles_select_admin_all" ON public.profiles;

-- Create new policy that allows both admins and super admins to view all profiles
CREATE POLICY "profiles_select_admin_and_super_admin" 
ON public.profiles 
FOR SELECT 
USING (
  is_admin() OR is_super_admin()
);