import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Post {
  id: number;
  title: string;
  content: string;
  category: '맛집' | '행사' | '생활' | '고민' | '일반';
  region?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_hidden: boolean;
  profiles?: {
    name?: string;
  };
}

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            name
          )
        `)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      toast.error('게시글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularPosts = async () => {
    try {
      setLoading(true);
      // Get posts with likes and comments count for popularity sorting
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            name
          ),
          likes (id),
          comments (id)
        `)
        .eq('is_hidden', false);

      if (error) {
        console.error('Error fetching popular posts:', error);
        
        // If RLS permission denied, try fallback without joins
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          console.log('RLS permission denied, trying fallback query...');
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('posts')
            .select('*')
            .eq('is_hidden', false)
            .order('created_at', { ascending: false })
            .limit(10);
          
          if (!fallbackError && fallbackData) {
            setPosts(fallbackData);
            return;
          }
        }
        
        // If all fails, set empty array to prevent crashes
        setPosts([]);
        return;
      }

      // Sort by popularity (likes + comments count)
      const sortedPosts = (data || []).sort((a, b) => {
        const aPopularity = (a.likes?.length || 0) + (a.comments?.length || 0);
        const bPopularity = (b.likes?.length || 0) + (b.comments?.length || 0);
        return bPopularity - aPopularity;
      });

      setPosts(sortedPosts);
    } catch (error: any) {
      console.error('Error fetching popular posts:', error);
      // Don't show toast error for RLS issues, just set empty array
      if (error.code !== '42501' && !error.message?.includes('permission denied')) {
        toast.error('인기 게시글을 불러오는데 실패했습니다.');
      }
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            name
          )
        `)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      console.error('Error fetching recent posts:', error);
      toast.error('최신 게시글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPosts = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            name
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      console.error('Error fetching my posts:', error);
      toast.error('내 게시글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (postData: {
    title: string;
    content: string;
    category: '맛집' | '행사' | '생활' | '고민' | '일반';
    region?: string;
  }) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('로그인이 필요합니다.');
      }

      const { error } = await supabase
        .from('posts')
        .insert({
          ...postData,
          user_id: user.id
        });

      if (error) throw error;
      
      toast.success('게시글이 작성되었습니다.');
      await fetchPosts();
      return true;
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error('게시글 작성에 실패했습니다.');
      return false;
    }
  };

  const updatePost = async (postId: number, postData: {
    title: string;
    content: string;
    category: '맛집' | '행사' | '생활' | '고민' | '일반';
    region?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update(postData)
        .eq('id', postId);

      if (error) throw error;
      
      toast.success('게시글이 수정되었습니다.');
      await fetchPosts();
      return true;
    } catch (error: any) {
      console.error('Error updating post:', error);
      toast.error('게시글 수정에 실패했습니다.');
      return false;
    }
  };

  const deletePost = async (postId: number) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      
      toast.success('게시글이 삭제되었습니다.');
      await fetchPosts();
      return true;
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast.error('게시글 삭제에 실패했습니다.');
      return false;
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return {
    posts,
    loading,
    fetchPosts,
    fetchPopularPosts,
    fetchRecentPosts,
    fetchMyPosts,
    createPost,
    updatePost,
    deletePost
  };
};