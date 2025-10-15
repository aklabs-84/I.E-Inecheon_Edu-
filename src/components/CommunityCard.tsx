import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Heart, MapPin, User, Clock, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import CommentSection from "@/components/CommentSection";
import { useState, useEffect } from "react";
import { useLikes } from "@/hooks/useLikes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CommunityCardProps {
  id: number;
  title: string;
  content: string;
  category: "맛집" | "행사" | "생활" | "고민" | "일반";
  region: string;
  author: string;
  createdAt: string;
  commentCount?: number;
  likeCount?: number;
  isLiked?: boolean;
  canEdit?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const CommunityCard = ({
  id,
  title,
  content,
  category,
  region,
  author,
  createdAt,
  commentCount: initialCommentCount = 0,
  likeCount: initialLikeCount = 0,
  isLiked: initialIsLiked = false,
  canEdit = false,
  onEdit,
  onDelete,
}: CommunityCardProps) => {
  const { toggleLike, getPostStats, loading: likeLoading } = useLikes();
  const [showComments, setShowComments] = useState(false);
  const [postStats, setPostStats] = useState({
    likeCount: initialLikeCount,
    commentCount: initialCommentCount,
    isLiked: initialIsLiked
  });

  useEffect(() => {
    const fetchStats = async () => {
      const stats = await getPostStats(id);
      setPostStats({
        likeCount: Number(stats.like_count) || 0,
        commentCount: Number(stats.comment_count) || 0,
        isLiked: stats.user_liked || false
      });
    };
    
    fetchStats();
  }, [id, getPostStats]);

  const handleLikeClick = async () => {
    const result = await toggleLike(id);
    if (result.success) {
      setPostStats(prev => ({
        ...prev,
        likeCount: result.likeCount,
        isLiked: result.liked
      }));
    }
  };

  const handleCommentClick = () => {
    setShowComments(true);
  };

  const handleCommentsClose = async () => {
    setShowComments(false);
    // Refresh stats to get updated comment count
    const stats = await getPostStats(id);
    setPostStats({
      likeCount: Number(stats.like_count) || 0,
      commentCount: Number(stats.comment_count) || 0,
      isLiked: stats.user_liked || false
    });
  };
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "맛집":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200";
      case "행사":
        return "bg-primary/10 text-primary hover:bg-primary/20";
      case "생활":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "고민":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      default:
        return "bg-muted text-muted-foreground hover:bg-muted/80";
    }
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group border-0 shadow-sm bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <Badge 
                variant="secondary" 
                className={getCategoryColor(category)}
              >
                {category}
              </Badge>
              {region && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 mr-1" />
                  {region}
                </div>
              )}
            </div>
            <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {title}
            </h3>
          </div>
          
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  수정
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
          {content}
        </p>

        {/* Author and Meta */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {author.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground font-medium">{author}</span>
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="w-3 h-3 mr-1" />
              {createdAt}
            </div>
          </div>

          {/* Engagement */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className={`p-1 h-auto transition-colors ${
                postStats.isLiked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-muted-foreground hover:text-red-500'
              }`}
              onClick={handleLikeClick}
              disabled={likeLoading}
            >
              <Heart className={`w-4 h-4 mr-1 ${postStats.isLiked ? 'fill-current' : ''}`} />
              <span className="text-xs">{postStats.likeCount}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 h-auto text-muted-foreground hover:text-primary"
              onClick={handleCommentClick}
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              <span className="text-xs">{postStats.commentCount}</span>
            </Button>
          </div>
        </div>
      </CardContent>

      <CommentSection
        postId={id}
        open={showComments}
        onOpenChange={handleCommentsClose}
      />
    </Card>
  );
};

export default CommunityCard;