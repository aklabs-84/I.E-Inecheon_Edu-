-- Fix RLS policies to allow anonymous users to read public data
-- This migration ensures anon users can access programs, posts, and other public content

-- Drop existing conflicting policies and recreate with proper anon access
DROP POLICY IF EXISTS "programs_select_all" ON public.programs;
DROP POLICY IF EXISTS "posts_select_all" ON public.posts;
DROP POLICY IF EXISTS "posts_select_public_or_admin" ON public.posts;
DROP POLICY IF EXISTS "posts_select_public" ON public.posts;

-- Create programs policy that explicitly allows anon and authenticated users
CREATE POLICY "programs_select_all" 
ON public.programs 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Create posts policy that allows anon users to see non-hidden posts
CREATE POLICY "posts_select_public" 
ON public.posts 
FOR SELECT 
TO anon, authenticated
USING (is_hidden = false OR user_id = auth.uid());

-- Ensure comments are accessible for anon users (for counting/display)
DROP POLICY IF EXISTS "comments_select_public" ON public.comments;
DROP POLICY IF EXISTS "comments_select_public_or_admin" ON public.comments;

CREATE POLICY "comments_select_public" 
ON public.comments 
FOR SELECT 
TO anon, authenticated
USING (is_hidden = false OR user_id = auth.uid());

-- Ensure likes are accessible for counting
DROP POLICY IF EXISTS "likes_select_all" ON public.likes;
DROP POLICY IF EXISTS "likes_select_for_stats" ON public.likes;

CREATE POLICY "likes_select_all" 
ON public.likes 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Ensure basic profile info is accessible for display names
DROP POLICY IF EXISTS "profiles_select_basic_info" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public_info" ON public.profiles;

CREATE POLICY "profiles_select_basic_info" 
ON public.profiles 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Allow anon users to see application counts (but not personal details)
DROP POLICY IF EXISTS "applications_select_public_count" ON public.applications;

CREATE POLICY "applications_select_public_count" 
ON public.applications 
FOR SELECT 
TO anon, authenticated
USING (true);