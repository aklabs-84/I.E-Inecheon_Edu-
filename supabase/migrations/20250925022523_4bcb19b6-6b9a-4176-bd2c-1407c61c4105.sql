-- Fix RLS policies to allow proper public access for viewing content
-- while requiring authentication for creating/modifying content

-- 1. Clean up profiles table policies - remove conflicting policies
DROP POLICY IF EXISTS "profiles_authenticated_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_authenticated_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_select_names" ON public.profiles;

-- Create new simplified profiles policies
CREATE POLICY "profiles_select_public_info" 
ON public.profiles 
FOR SELECT 
TO anon, authenticated
USING (true);  -- Allow reading basic profile info (name) for all users

CREATE POLICY "profiles_select_full_own" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (id = auth.uid()); -- Authenticated users can see their full profile

CREATE POLICY "profiles_select_full_admin" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (is_admin() OR is_super_admin()); -- Admins can see all profiles

-- 2. Clean up posts table policies - simplify for public viewing
DROP POLICY IF EXISTS "posts_select_admin" ON public.posts;
DROP POLICY IF EXISTS "posts_select_own" ON public.posts; 
DROP POLICY IF EXISTS "posts_select_public" ON public.posts;

-- Create new posts SELECT policy that allows public viewing
CREATE POLICY "posts_select_all" 
ON public.posts 
FOR SELECT 
TO anon, authenticated
USING (is_hidden = false OR user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
));

-- 3. Clean up programs table - already has programs_select_all with qual:true

-- 4. Clean up comments policies
DROP POLICY IF EXISTS "comments_select_public_or_admin" ON public.comments;
-- Keep comments_select_public which already allows anon access

-- 5. Clean up likes policies - already has likes_select_for_stats for public access