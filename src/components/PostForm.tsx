import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Post } from '@/hooks/usePosts';

interface PostFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    content: string;
    category: '맛집' | '행사' | '생활' | '고민' | '일반';
    region?: string;
  }) => Promise<boolean>;
  post?: Post;
  loading?: boolean;
}

const PostForm = ({ open, onOpenChange, onSubmit, post, loading = false }: PostFormProps) => {
  const [title, setTitle] = useState(post?.title || '');
  const [content, setContent] = useState(post?.content || '');
  const [category, setCategory] = useState<'맛집' | '행사' | '생활' | '고민' | '일반' | ''>(post?.category || '');
  const [region, setRegion] = useState(post?.region || '');

  // Update form fields when post prop changes
  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setContent(post.content || '');
      setCategory(post.category || '');
      setRegion(post.region || '');
    } else {
      setTitle('');
      setContent('');
      setCategory('');
      setRegion('');
    }
  }, [post]);

  const categories = [
    { value: '일반', label: '일반' },
    { value: '행사', label: '행사' },
    { value: '생활', label: '생활' },
    { value: '고민', label: '고민' },
    { value: '맛집', label: '맛집' }
  ];

  const regions = [
    '중구', '동구', '미추홀구', '연수구', '남동구', 
    '부평구', '계양구', '서구', '강화군', '옹진군'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim() || !category) {
      return;
    }

    const success = await onSubmit({
      title: title.trim(),
      content: content.trim(),
      category: category as '맛집' | '행사' | '생활' | '고민' | '일반',
      region: region || undefined
    });

    if (success) {
      setTitle('');
      setContent('');
      setCategory('');
      setRegion('');
      onOpenChange(false);
    }
  };

  const resetForm = () => {
    setTitle(post?.title || '');
    setContent(post?.content || '');
    setCategory(post?.category || '');
    setRegion(post?.region || '');
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {post ? '게시글 수정' : '새 글 쓰기'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">카테고리 *</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as '맛집' | '행사' | '생활' | '고민' | '일반')} required>
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">지역</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="지역 선택 (선택사항)" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">내용 *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              rows={8}
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={loading || !title.trim() || !content.trim() || !category}
            >
              {loading ? '저장 중...' : (post ? '수정' : '작성')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PostForm;