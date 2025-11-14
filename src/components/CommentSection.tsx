import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Send, Trash2, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useComments } from '@/hooks/useComments';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CommentSectionProps {
  postId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CommentSection = ({ postId, open, onOpenChange }: CommentSectionProps) => {
  const { user } = useAuth();
  const { comments, loading, fetchComments, addComment, deleteComment } = useComments();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && postId) {
      fetchComments(postId);
    }
  }, [open, postId, fetchComments]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    const success = await addComment(postId, newComment);
    if (success) {
      setNewComment('');
    }
    setIsSubmitting(false);
  };

  const handleDeleteComment = async (commentId: number) => {
    if (confirm('댓글을 삭제하시겠습니까?')) {
      await deleteComment(commentId, postId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}분 전`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}시간 전`;
    } else {
      return `${Math.floor(diffInHours / 24)}일 전`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            댓글 ({comments.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Comment Input */}
          {user && (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <Textarea
                    placeholder="댓글을 입력하세요..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || isSubmitting}
                      size="sm"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSubmitting ? '작성 중...' : '댓글 작성'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                댓글을 불러오는 중...
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
              </div>
            ) : (
              comments.map((comment) => (
                <Card key={comment.id} className="bg-muted/30">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {(comment.profiles?.name || '익명')[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">
                              {comment.profiles?.name || '익명'}
                            </span>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDate(comment.created_at)}
                            </div>
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                      
                      {user?.id === comment.user_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {!user && (
            <div className="text-center py-4 text-muted-foreground">
              댓글을 작성하려면 로그인이 필요합니다.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentSection;