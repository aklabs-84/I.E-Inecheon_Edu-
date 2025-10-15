-- Fix likes table RLS policies to prevent exposure of user activity data

-- Drop the overly permissive policy that allows public access
DROP POLICY IF EXISTS "likes_select_all" ON public.likes;

-- Create secure policy that only allows users to see their own likes
CREATE POLICY "likes_select_own" 
ON public.likes 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Keep existing secure insert and delete policies (no changes needed)
-- likes_insert_own: WITH CHECK (user_id = auth.uid())
-- likes_delete_own: USING (user_id = auth.uid())

-- Ensure RLS is enabled and enforced
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes FORCE ROW LEVEL SECURITY;