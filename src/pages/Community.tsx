import Header from "@/components/Header";
import CommunityCard from "@/components/CommunityCard";
import PostForm from "@/components/PostForm";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePosts } from "@/hooks/usePosts";
import { toast } from "sonner";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const Community = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { posts, loading, fetchPosts, fetchPopularPosts, fetchRecentPosts, fetchMyPosts, createPost, updatePost, deletePost } = usePosts();
  const [showPostForm, setShowPostForm] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedRegion, setSelectedRegion] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const categories = ["전체", "일반", "행사", "생활", "고민", "맛집"];
  const regions = ["전체", "중구", "동구", "미추홀구", "연수구", "남동구", "부평구", "계양구", "서구", "강화군", "옹진군"];

  useEffect(() => {
    document.title = "커뮤니티 - 인천 Connect Hub";
  }, []);

  useEffect(() => {
    if (activeTab === "my" && user) {
      fetchMyPosts(user.id);
    } else if (activeTab === "popular") {
      fetchPopularPosts();
    } else if (activeTab === "recent") {
      fetchRecentPosts();
    } else if (activeTab === "all") {
      fetchPosts();
    }
  }, [activeTab, user]);

  const handleNewPost = () => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    setEditingPost(null);
    setShowPostForm(true);
  };

  const handleEditPost = (post: any) => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    setEditingPost(post);
    setShowPostForm(true);
  };

  const handleDeletePost = async (postId: number) => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    if (confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
      await deletePost(postId);
    }
  };

  const handlePostSubmit = async (data: any) => {
    setIsFormLoading(true);
    try {
      let success = false;
      if (editingPost) {
        success = await updatePost(editingPost.id, data);
      } else {
        success = await createPost(data);
      }
      return success;
    } finally {
      setIsFormLoading(false);
    }
  };

  // Filter and sort posts based on selected filters
  const getFilteredPosts = () => {
    let filtered = posts;

    // Filter by category
    if (selectedCategory !== "전체") {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    // Filter by region
    if (selectedRegion !== "전체") {
      filtered = filtered.filter(post => post.region === selectedRegion);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(query) || 
        post.content.toLowerCase().includes(query)
      );
    }

    // Sort posts if not in special tabs (popular/recent tabs have their own sorting)
    if (activeTab === "all" || activeTab === "my") {
      switch (sortBy) {
        case "popular":
          // Sort by engagement (this is approximate since we'd need to fetch stats)
          break;
        case "comments":
          // Sort by comment count
          break;
        case "latest":
        default:
          // Already sorted by creation date from backend
          break;
      }
    }

    return filtered;
  };

  // Get paginated posts
  const filteredPosts = getFilteredPosts();
  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPosts = filteredPosts.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedRegion, searchQuery, sortBy, activeTab]);

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
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">커뮤니티</h1>
            <p className="text-muted-foreground">
              프로그램 참여자들과 정보를 공유하고 소통해보세요
            </p>
          </div>
          {user ? (
            <Button onClick={handleNewPost} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              새 글 쓰기
            </Button>
          ) : (
            <Button onClick={() => navigate('/auth')} variant="outline" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              로그인 후 글쓰기
            </Button>
          )}
        </div>

        {/* Tabs for Different Views */}
        <Tabs defaultValue="all" className="mb-8" onValueChange={setActiveTab}>
          <TabsList className={`grid w-full ${user ? 'grid-cols-4' : 'grid-cols-3'} lg:w-[400px]`}>
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="popular">인기글</TabsTrigger>
            <TabsTrigger value="recent">최신글</TabsTrigger>
            {user && <TabsTrigger value="my">내 글</TabsTrigger>}
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="제목 또는 내용으로 검색..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* Filter Button */}
                <Button variant="outline" size="default" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  필터
                </Button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="카테고리" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="지역" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                총 <span className="font-semibold text-foreground">{filteredPosts.length}</span>개의 게시글
                {(selectedCategory !== "전체" || selectedRegion !== "전체" || searchQuery.trim()) && (
                  <span className="ml-2">
                    (전체 {posts.length}개 중 필터링됨)
                  </span>
                )}
              </p>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">정렬:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="latest">최신순</SelectItem>
                    <SelectItem value="popular">인기순</SelectItem>
                    <SelectItem value="comments">댓글순</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Posts List */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  게시글을 불러오는 중...
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {posts.length === 0 
                    ? "아직 게시글이 없습니다."
                    : "검색 조건에 맞는 게시글이 없습니다."
                  }
                </div>
              ) : (
                currentPosts.map((post) => (
                  <CommunityCard 
                    key={post.id} 
                    id={post.id}
                    title={post.title}
                    content={post.content}
                    category={post.category}
                    region={post.region}
                     author={post.profiles?.name || 
                            (post.user_id ? '사용자' : '익명')}
                     createdAt={formatDate(post.created_at)}
                    canEdit={user?.id === post.user_id}
                    onEdit={() => handleEditPost(post)}
                    onDelete={() => handleDeletePost(post.id)}
                  />
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="justify-center">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current page
                    const showPage = page === 1 || 
                                    page === totalPages || 
                                    (page >= currentPage - 1 && page <= currentPage + 1);
                    
                    if (!showPage) {
                      // Show ellipsis if there's a gap
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    }
                    
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === page}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page);
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </TabsContent>

          <TabsContent value="popular">
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  인기글을 불러오는 중...
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  인기 게시글이 없습니다.
                </div>
              ) : (
                posts.map((post) => (
                  <CommunityCard 
                    key={post.id} 
                    id={post.id}
                    title={post.title}
                    content={post.content}
                    category={post.category}
                    region={post.region}
                     author={post.profiles?.name || 
                            (post.user_id ? '사용자' : '익명')}
                     createdAt={formatDate(post.created_at)}
                     canEdit={user?.id === post.user_id}
                     onEdit={() => handleEditPost(post)}
                     onDelete={() => handleDeletePost(post.id)}
                   />
                 ))
               )}
            </div>
          </TabsContent>

          <TabsContent value="recent">
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  최신글을 불러오는 중...
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  최신 게시글이 없습니다.
                </div>
              ) : (
                posts.map((post) => (
                  <CommunityCard 
                    key={post.id} 
                    id={post.id}
                    title={post.title}
                    content={post.content}
                    category={post.category}
                    region={post.region}
                    author={post.profiles?.name || 
                            (post.user_id ? '사용자' : '익명')}
                    createdAt={formatDate(post.created_at)}
                    canEdit={user?.id === post.user_id}
                    onEdit={() => handleEditPost(post)}
                    onDelete={() => handleDeletePost(post.id)}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="my">
            {!user ? (
              <div className="text-center py-8 text-muted-foreground">
                로그인이 필요합니다.
              </div>
            ) : (
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    내 게시글을 불러오는 중...
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    작성한 게시글이 없습니다.
                  </div>
                ) : (
                  posts.map((post) => (
                    <CommunityCard 
                      key={post.id} 
                      id={post.id}
                      title={post.title}
                      content={post.content}
                      category={post.category}
                      region={post.region}
                      author={post.profiles?.name || 
                              (post.user_id ? '사용자' : '익명')}
                      createdAt={formatDate(post.created_at)}
                      canEdit={true}
                      onEdit={() => handleEditPost(post)}
                      onDelete={() => handleDeletePost(post.id)}
                    />
                  ))
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <PostForm 
          open={showPostForm}
          onOpenChange={setShowPostForm}
          onSubmit={handlePostSubmit}
          post={editingPost}
          loading={isFormLoading}
        />
      </main>
      <Footer />
    </div>
  );
};

export default Community;