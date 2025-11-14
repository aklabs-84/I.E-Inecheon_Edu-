-- Fix RLS policies to ensure anon users can access all public content
-- The problem is role mismatch between 'public' and 'anon'

-- Drop and recreate programs policy with correct role
DROP POLICY IF EXISTS "programs_select_all" ON public.programs;

CREATE POLICY "programs_select_all" 
ON public.programs 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Also fix profiles policy names and ensure consistent anon access
-- The profiles_select_public_info should work but let's make sure it's consistent
DROP POLICY IF EXISTS "profiles_select_public_info" ON public.profiles;

CREATE POLICY "profiles_select_basic_info" 
ON public.profiles 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Ensure posts policy is correct (it should already be fine)
-- But let's make sure likes can be accessed by anon for counting
DROP POLICY IF EXISTS "likes_select_for_stats" ON public.likes;

CREATE POLICY "likes_select_for_stats" 
ON public.likes 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Same for comments
DROP POLICY IF EXISTS "comments_select_public" ON public.comments;

CREATE POLICY "comments_select_public" 
ON public.comments 
FOR SELECT 
TO anon, authenticated
USING (is_hidden = false);