import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useLikes = () => {
  const [loading, setLoading] = useState(false);

  const toggleLike = useCallback(async (postId: number) => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('로그인이 필요합니다.');
        return { success: false, liked: false, likeCount: 0 };
      }

      // Check if user already liked this post
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike the post
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Get updated like count
        const { data: stats } = await supabase.rpc('get_post_stats', { 
          post_id_param: postId 
        });
        
        return { 
          success: true, 
          liked: false, 
          likeCount: stats?.[0]?.like_count || 0 
        };
      } else {
        // Like the post
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: user.id });

        if (error) throw error;

        // Get updated like count
        const { data: stats } = await supabase.rpc('get_post_stats', { 
          post_id_param: postId 
        });
        
        return { 
          success: true, 
          liked: true, 
          likeCount: stats?.[0]?.like_count || 0 
        };
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
      toast.error('좋아요 처리 중 오류가 발생했습니다.');
      return { success: false, liked: false, likeCount: 0 };
    } finally {
      setLoading(false);
    }
  }, []);

  const getPostStats = useCallback(async (postId: number) => {
    try {
      const { data, error } = await supabase.rpc('get_post_stats', { 
        post_id_param: postId 
      });
      
      if (error) throw error;
      
      return data?.[0] || { like_count: 0, comment_count: 0, user_liked: false };
    } catch (error) {
      console.error('Error fetching post stats:', error);
      return { like_count: 0, comment_count: 0, user_liked: false };
    }
  }, []);

  return {
    toggleLike,
    getPostStats,
    loading
  };
};