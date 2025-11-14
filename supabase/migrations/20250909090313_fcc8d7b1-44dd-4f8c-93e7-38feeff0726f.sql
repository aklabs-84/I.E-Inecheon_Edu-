-- Allow super admins to fully manage applications
-- Ensure RLS is enabled (it already is, but this is idempotent)
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- SELECT: super admins can view all applications
CREATE POLICY applications_select_super_admin
ON public.applications
FOR SELECT
USING (is_super_admin());

-- UPDATE: super admins can update any application
CREATE POLICY applications_update_super_admin
ON public.applications
FOR UPDATE
USING (is_super_admin());

-- DELETE: super admins can delete any application
CREATE POLICY applications_delete_super_admin
ON public.applications
FOR DELETE
USING (is_super_admin());