import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Comment {
  id: number;
  content: string;
  user_id: string;
  post_id: number;
  created_at: string;
  updated_at: string;
  is_hidden: boolean;
  profiles?: {
    name?: string;
  };
}

export const useComments = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async (postId: number) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles (
            name
          )
        `)
        .eq('post_id', postId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      toast.error('댓글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const addComment = useCallback(async (postId: number, content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('로그인이 필요합니다.');
        return false;
      }

      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim()
        });

      if (error) throw error;
      
      toast.success('댓글이 작성되었습니다.');
      await fetchComments(postId);
      return true;
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error('댓글 작성에 실패했습니다.');
      return false;
    }
  }, [fetchComments]);

  const deleteComment = useCallback(async (commentId: number, postId: number) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      
      toast.success('댓글이 삭제되었습니다.');
      await fetchComments(postId);
      return true;
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      toast.error('댓글 삭제에 실패했습니다.');
      return false;
    }
  }, [fetchComments]);

  return {
    comments,
    loading,
    fetchComments,
    addComment,
    deleteComment
  };
};