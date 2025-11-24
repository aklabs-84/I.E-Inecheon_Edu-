import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, Users, MapPin, TrendingUp, MessageCircle, BookOpen, Heart, Award } from "lucide-react";
import Header from "@/components/Header";
import ProgramCard from "@/components/ProgramCard";
import CommunityCard from "@/components/CommunityCard";
import { usePrograms } from "@/hooks/usePrograms";
import { usePosts } from "@/hooks/usePosts";
import { useProgramApplications } from "@/hooks/useApplications";
import { useEffect, useState } from "react";
import { useSatisfaction } from "@/hooks/useSatisfaction";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";

const Home = () => {
  const navigate = useNavigate();
  const { data: programs = [], isLoading: programsLoading } = usePrograms();
  const { posts, loading: postsLoading, fetchPopularPosts } = usePosts();
  const [popularPrograms, setPopularPrograms] = useState<any[]>([]);
  const [popularPosts, setPopularPosts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Get program IDs for application counts
  const programIds = programs.map(p => p.id);
  const { data: applicationCounts = {} } = useProgramApplications(programIds);

  useEffect(() => {
    document.title = "인천에듀-인천 Connect Hub";
  }, []);

  useEffect(() => {
    // 인기 게시글 가져오기 (좋아요 + 댓글 수 기준)
    fetchPopularPosts();
  }, []);

  useEffect(() => {
    // 현재 모집중인 프로그램 필터링 및 정렬 (신청자 수 기준)
    if (programs.length > 0) {
      const currentDate = new Date();
      const recruitingPrograms = programs.filter(program => {
        // 현재 날짜가 모집 기간 내에 있고 정원이 차지 않은 프로그램
        const startDate = program.start_at ? new Date(program.start_at) : null;
        const endDate = program.end_at ? new Date(program.end_at) : null;
        const applicationCount = applicationCounts[program.id] || 0;
        const capacity = program.capacity || 0;
        
        // 모집 기간 내에 있고 정원이 차지 않은 프로그램
        return startDate && 
               currentDate <= startDate && 
               applicationCount < capacity;
      });
      
      const sortedPrograms = recruitingPrograms
        .sort((a, b) => (applicationCounts[b.id] || 0) - (applicationCounts[a.id] || 0))
        .slice(0, 3);
      setPopularPrograms(sortedPrograms);
    }
  }, [programs, applicationCounts]);

  useEffect(() => {
    // 커뮤니티 인기 게시글 (최대 3개)
    if (posts.length > 0) {
      setPopularPosts(posts.slice(0, 3));
    }
  }, [posts]);

  // Search handlers
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    navigate(`/programs?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleCategorySearch = (category: string) => {
    navigate(`/programs?category=${encodeURIComponent(category)}`);
  };

  const stats = [
    { label: "등록된 프로그램", value: programs.length.toString(), icon: BookOpen },
    { label: "총 참여자 수", value: Object.values(applicationCounts).reduce((sum, count) => sum + count, 0).toString(), icon: Users },
    { label: "활성 커뮤니티", value: posts.length.toString(), icon: MessageCircle },
  ];

  // derive unique categories (program keywords) from programs
  const categories = Array.from(new Set([...programs.map((p: any) => p.category || "기타"), "학습"]))
    .sort();

  // 만족도는 현재 숨김 — 대신 등록된 프로그램/총 참여자/활성 커뮤니티 세 가지를 강조
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* badge - centered */}
            <div className="flex items-center justify-center space-x-2 mb-4">
              <MapPin className="w-5 h-5 text-primary" />
              <Badge variant="outline" className="text-primary border-primary">
                인천광역시 동구 교육포털
              </Badge>
            </div>

            {/* title - responsive sizes and tighter mobile leading */}
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 leading-tight sm:leading-snug md:leading-normal bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              인천 교육의 모든 것,
              <br />
              한 곳에서 만나보세요
            </h1>

            {/* 
            <p className="text-base sm:text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              인천 지역 교육 프로그램부터 학부모 커뮤니티까지,<br />
              우리 아이들의 더 나은 교육을 위한 통합 플랫폼입니다.
            </p>
            */}


            <p className="text-base sm:text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              <span className="hidden sm:inline">
                인천 지역 교육 프로그램부터 학부모 커뮤니티까지,
                <br />
                우리 아이들의 더 나은 교육을 위한 통합 플랫폼입니다.
              </span>
              <span className="sm:hidden block">
                인천 지역 교육 프로그램부터<br />
                학부모 커뮤니티까지<br />
                우리 아이들의 더 나은 교육을<br />
                위한 통합 플랫폼입니다.
             </span>
            </p>




            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto justify-center items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input 
                  placeholder="원하는 프로그램이나 지역을 검색해보세요..."
                  className="pl-12 h-12 text-base bg-background/80 backdrop-blur border-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
              </div>
              <Button 
                size="lg" 
                className="h-12 px-8 bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
                onClick={handleSearch}
              >
                검색하기
              </Button>
            </div>

            {/* Program category badges (responsive) */}
            <div className="flex flex-wrap gap-3 mt-6 justify-center">
              {categories.map((cat) => (
                <Badge
                  key={cat}
                  variant="outline"
                  className="cursor-pointer px-3 sm:px-5 py-2 sm:py-3 text-sm sm:text-base md:text-lg font-medium border-purple-300 text-purple-700 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all duration-300"
                  onClick={() => handleCategorySearch(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gradient-to-r from-background to-accent/10">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center mx-auto" style={{ maxWidth: 1100 }}>
            {stats.slice(0, 3).map((stat, index) => (
              <Card key={index} className="text-center border-0 shadow-sm bg-gradient-to-br from-card to-card/80 w-full max-w-sm">
                <CardContent className="pt-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10 mb-6">
                    <stat.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-4xl md:text-5xl font-extrabold text-primary mb-2">
                    {stat.value}
                  </div>
                  <p className="text-lg md:text-base text-muted-foreground">
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Programs */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">현재 모집중인 프로그램</h2>
              <p className="text-muted-foreground">지금 신청 가능한 교육 프로그램을 만나보세요</p>
            </div>
            <Button variant="outline" className="hidden sm:flex" onClick={() => navigate('/programs')}>
              전체보기
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {programsLoading ? (
              <div className="col-span-full text-center text-muted-foreground">
                프로그램을 불러오는 중...
              </div>
            ) : popularPrograms.length > 0 ? (
              popularPrograms.map((program) => {
                const currentDate = new Date();
                const startDate = program.start_at ? new Date(program.start_at) : null;
                const endDate = program.end_at ? new Date(program.end_at) : null;
                const applicationCount = applicationCounts[program.id] || 0;
                const capacity = program.capacity || 0;
                
                let status: "모집중" | "마감" | "진행중" | "완료" = "모집중";
                if (endDate && currentDate > endDate) {
                  status = "완료";
                } else if (startDate && currentDate >= startDate && endDate && currentDate <= endDate) {
                  status = "진행중";
                } else if (applicationCount >= capacity) {
                  status = "마감";
                }
                
                return (
                  <ProgramCard 
                    key={program.id} 
                    id={program.id}
                    title={program.title}
                    category={program.category || "기타"}
                    region={program.region || "전체"}
                    startDate={program.start_at ? new Date(program.start_at).toLocaleDateString() : ""}
                    endDate={program.end_at ? new Date(program.end_at).toLocaleDateString() : ""}
                    capacity={program.capacity || 0}
                    currentApplicants={applicationCount}
                    description={program.description || ""}
                    status={status}
                    imageUrl={program.image_url || ""}
                  />
                );
              })
            ) : (
              <div className="col-span-full text-center text-muted-foreground">
                현재 모집중인 프로그램이 없습니다.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-16 bg-gradient-to-r from-accent/5 to-background">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">커뮤니티 게시판</h2>
              <p className="text-muted-foreground">인천 학부모들의 생생한 정보 공유</p>
            </div>
            <Button variant="outline" className="hidden sm:flex" onClick={() => navigate('/community')}>
              커뮤니티 가기
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {postsLoading ? (
              <div className="col-span-full text-center text-muted-foreground">
                게시글을 불러오는 중...
              </div>
            ) : popularPosts.length > 0 ? (
              popularPosts.map((post) => (
                <CommunityCard 
                  key={post.id} 
                  id={post.id}
                  title={post.title}
                  content={post.content}
                  category={post.category}
                  region={post.region || "전체"}
                  author={post.profiles?.name || "익명"}
                  createdAt={new Date(post.created_at).toLocaleDateString()}
                  commentCount={post.comments?.length || 0}
                  likeCount={post.likes?.length || 0}
                  isLiked={false}
                />
              ))
            ) : (
              <div className="col-span-full text-center text-muted-foreground">
                등록된 게시글이 없습니다.
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;