-- Allow super admins to manage programs as well as admins
-- Update RLS policies on public.programs

-- Delete existing policies that only allow admins
DROP POLICY IF EXISTS "programs_admin_delete" ON public.programs;
DROP POLICY IF EXISTS "programs_admin_update" ON public.programs;
DROP POLICY IF EXISTS "programs_admin_write" ON public.programs;

-- Recreate policies to allow both admins and super admins
CREATE POLICY "programs_admin_delete"
ON public.programs
FOR DELETE
USING (is_admin() OR is_super_admin());

CREATE POLICY "programs_admin_update"
ON public.programs
FOR UPDATE
USING (is_admin() OR is_super_admin());

CREATE POLICY "programs_admin_write"
ON public.programs
FOR INSERT
WITH CHECK (is_admin() OR is_super_admin());