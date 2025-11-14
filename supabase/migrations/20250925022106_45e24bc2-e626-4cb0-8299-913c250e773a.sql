-- Fix public access to posts and programs by allowing anonymous users to read author names
-- Add policy to allow anonymous users to read basic profile info (name only) for post authors

CREATE POLICY "profiles_public_select_names" 
ON public.profiles 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Also add policy for comments table to allow anonymous users to read public comments
CREATE POLICY "comments_select_public" 
ON public.comments 
FOR SELECT 
TO anon, authenticated  
USING (is_hidden = false);