-- Enable realtime for posts, comments, likes, applications tables
ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.comments REPLICA IDENTITY FULL; 
ALTER TABLE public.likes REPLICA IDENTITY FULL;
ALTER TABLE public.applications REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER publication supabase_realtime ADD TABLE public.posts;
ALTER publication supabase_realtime ADD TABLE public.comments;
ALTER publication supabase_realtime ADD TABLE public.likes;
ALTER publication supabase_realtime ADD TABLE public.applications;
ALTER publication supabase_realtime ADD TABLE public.profiles;