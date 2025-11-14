-- Fix the search path issue for the function
CREATE OR REPLACE FUNCTION get_post_stats(post_id_param bigint)
RETURNS TABLE(like_count bigint, comment_count bigint, user_liked boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*) FROM public.likes WHERE post_id = post_id_param) as like_count,
    (SELECT COUNT(*) FROM public.comments WHERE post_id = post_id_param AND is_hidden = false) as comment_count,
    (SELECT EXISTS(SELECT 1 FROM public.likes WHERE post_id = post_id_param AND user_id = auth.uid())) as user_liked;
$$;