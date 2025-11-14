-- Fix profiles table RLS policies to be more restrictive and secure

-- Drop existing policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin_and_super_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- Create more secure policies that explicitly check for authentication

-- Users can only view their own profile (and only when authenticated)
CREATE POLICY "profiles_select_own_secure" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = id);

-- Admins and super admins can view all profiles (and only when authenticated)
CREATE POLICY "profiles_select_admin_secure" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL AND (is_admin() OR is_super_admin()));

-- Users can only insert their own profile (and only when authenticated)
CREATE POLICY "profiles_insert_own_secure" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = id);

-- Users can only update their own profile (and only when authenticated)
CREATE POLICY "profiles_update_own_secure" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner (additional security)
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;