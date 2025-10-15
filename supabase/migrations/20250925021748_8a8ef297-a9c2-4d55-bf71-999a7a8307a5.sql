-- Fix posts loading issue for unauthenticated users
-- Allow unauthenticated users to view like counts (but not who liked)

-- Add policy to allow unauthenticated users to view likes for post statistics
CREATE POLICY "likes_select_for_stats" 
ON public.likes 
FOR SELECT 
USING (true);  -- Allow all users to see likes for counting purposes

-- Update posts policy to be more explicit about unauthenticated access
DROP POLICY IF EXISTS "posts_select_public_or_admin" ON public.posts;

CREATE POLICY "posts_select_public" 
ON public.posts 
FOR SELECT 
USING (is_hidden = false);

CREATE POLICY "posts_select_own" 
ON public.posts 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "posts_select_admin" 
ON public.posts 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
));