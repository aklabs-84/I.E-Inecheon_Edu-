import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Calendar, MapPin, Users, Trophy } from "lucide-react";

interface Program {
  id: number;
  title: string;
  description: string;
  category: string;
  region: string;
  start_at: string;
  end_at: string;
  capacity: number;
  image_url?: string;
  matchScore?: number;
}

interface UserProfile {
  region: string;
  preferred_category: string;
  learning_style: string;
  available_time: string;
  learning_purpose: string;
  age_group: string;
  gender: string;
}

const RecommendationResult = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [recommendedPrograms, setRecommendedPrograms] = useState<Program[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = "맞춤 추천 - 인천 Connect Hub";
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchRecommendations();
    }
  }, [user, loading, navigate]);

  const fetchRecommendations = async () => {
    try {
      // 사용자 프로필 가져오기
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;
      
      if (!profile.onboarding_completed) {
        navigate('/onboarding');
        return;
      }

      setUserProfile(profile);

      // 모든 프로그램 가져오기
      const { data: programs, error: programsError } = await supabase
        .from('programs')
        .select('*');

      if (programsError) throw programsError;

      // 추천 알고리즘 적용
      const scoredPrograms = programs.map(program => ({
        ...program,
        matchScore: calculateMatchScore(program, profile)
      }));

      // 점수 순으로 정렬하고 상위 6개만
      const sortedPrograms = scoredPrograms
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
        .slice(0, 6);

      setRecommendedPrograms(sortedPrograms);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error("추천 프로그램을 가져오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMatchScore = (program: any, profile: UserProfile): number => {
    let score = 0;

    // 지역 매칭 (30점)
    if (program.region === profile.region) {
      score += 30;
    } else if (profile.region && program.region) {
      // 인천 내 다른 지역이면 20점
      score += 20;
    }

    // 카테고리 매칭 (40점)
    if (program.category === profile.preferred_category) {
      score += 40;
    }

    // 학습 목적 매칭 (20점)
    if (profile.learning_purpose === '자격증' && program.description?.includes('자격증')) {
      score += 20;
    } else if (profile.learning_purpose === '취업' && program.description?.includes('취업')) {
      score += 20;
    } else if (profile.learning_purpose === '취미' && program.description?.includes('취미')) {
      score += 20;
    }

    // 시간대 매칭 (10점)
    const availableTimes = profile.available_time?.split(',') || [];
    if (availableTimes.some(time => program.description?.includes(time))) {
      score += 10;
    }

    return score;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'bg-gray-500';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">🎉 맞춤 프로그램 추천</h1>
            <p className="text-muted-foreground">
              회원님의 프로필을 기반으로 가장 적합한 프로그램들을 추천해드립니다.
            </p>
            {userProfile && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">{userProfile.region}</span> 거주, 
                  <span className="font-medium"> {userProfile.preferred_category}</span> 관심, 
                  <span className="font-medium"> {userProfile.learning_purpose}</span> 목적
                </p>
              </div>
            )}
          </div>

          {recommendedPrograms.length === 0 ? (
            <Card className="text-center p-8">
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  현재 회원님에게 맞는 프로그램이 없습니다.
                </p>
                <Button onClick={() => navigate('/programs')}>
                  모든 프로그램 보기
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {recommendedPrograms.map((program, index) => (
                <Card key={program.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
                  <div className="relative">
                    {program.image_url && (
                      <img 
                        src={program.image_url} 
                        alt={program.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                      <Badge className={`${getScoreColor(program.matchScore)} text-white text-xs px-2 py-1`}>
                        {index === 0 && <Trophy className="w-3 h-3 mr-1" />}
                        매칭도 {program.matchScore || 0}%
                      </Badge>
                      {index === 0 && (
                        <Badge className="bg-gold text-black text-xs px-2 py-1">
                          최고 추천
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg leading-relaxed">{program.title}</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="flex flex-col flex-grow">
                    <div className="flex-grow space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed min-h-[2.5rem]">
                        {program.description}
                      </p>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="flex-grow">{program.region}</span>
                          <Badge variant="outline" className="text-xs">{program.category}</Badge>
                        </div>
                        
                        {program.start_at && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs">{formatDate(program.start_at)} ~ {formatDate(program.end_at)}</span>
                          </div>
                        )}
                        
                        {program.capacity && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs">정원 {program.capacity}명</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t">
                      <Button 
                        className="w-full" 
                        onClick={() => navigate(`/programs/${program.id}`)}
                      >
                        자세히 보기
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center space-x-4">
            <Button onClick={() => navigate('/programs')} variant="outline">
              모든 프로그램 보기
            </Button>
            <Button onClick={() => navigate('/')}>
              홈으로 돌아가기
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RecommendationResult;