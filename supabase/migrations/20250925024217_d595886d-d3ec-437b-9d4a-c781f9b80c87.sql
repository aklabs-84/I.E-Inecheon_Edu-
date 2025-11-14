-- Fix the core issue: posts and applications need anon SELECT access

-- 1) Fix posts table - ensure anon users can read non-hidden posts
DROP POLICY IF EXISTS "posts_select_all" ON public.posts;
CREATE POLICY "posts_select_all"
ON public.posts
FOR SELECT
TO anon, authenticated
USING (
  (is_hidden = false) OR 
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR 
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ))
);

-- 2) Fix applications table - anon users need to read for counting applications
DROP POLICY IF EXISTS "applications_select_own_or_admin" ON public.applications;
DROP POLICY IF EXISTS "applications_select_super_admin" ON public.applications;

-- Allow anon users to read applications for counting purposes
CREATE POLICY "applications_select_public_count"
ON public.applications
FOR SELECT
TO anon, authenticated
USING (true);

-- Users can still see their own applications with full details
CREATE POLICY "applications_select_own"
ON public.applications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can see all applications
CREATE POLICY "applications_select_admin"
ON public.applications
FOR SELECT
TO authenticated
USING (is_admin() OR is_super_admin());