import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMyBlacklistStatus } from "@/hooks/useBlacklist";
import { useEffect } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Users, Clock, ArrowLeft, User, Ban } from "lucide-react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Footer from "@/components/Footer";

const ProgramDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: blacklistStatus, isLoading: isBlacklistLoading } = useMyBlacklistStatus();

  // 프로그램 상세 정보 조회
  const { data: program, isLoading: programLoading } = useQuery({
    queryKey: ["program", id],
    queryFn: async () => {
      if (!id) throw new Error("Program ID is required");
      
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .eq("id", parseInt(id))
        .single();

      if (error) {
        console.error("Error fetching program:", error);
        throw error;
      }

      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    document.title = program?.title ? `${program.title} - 인천 Connect Hub` : "프로그램 상세 - 인천 Connect Hub";
  }, [program?.title]);

  // 프로그램 신청자 수 조회
  const { data: applicationCount = 0 } = useQuery({
    queryKey: ["program-applications", id],
    queryFn: async () => {
      if (!id) return 0;
      
      const { data, error } = await supabase
        .from("applications")
        .select("id", { count: "exact" })
        .eq("program_id", parseInt(id));

      if (error) {
        console.error("Error fetching application count:", error);
        return 0;
      }

      return data?.length || 0;
    },
    enabled: !!id,
  });

  // 사용자의 신청 상태 확인
  const { data: userApplication } = useQuery({
    queryKey: ["user-application", id, user?.id],
    queryFn: async () => {
      if (!id || !user?.id) return null;
      
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("program_id", parseInt(id))
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user application:", error);
        return null;
      }

      return data;
    },
    enabled: !!id && !!user?.id,
  });

  // 프로그램 신청 뮤테이션
  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!id || !user?.id) {
        throw new Error("로그인이 필요합니다.");
      }

      // 블랙리스트 체크
      if (blacklistStatus && blacklistStatus.is_active && new Date(blacklistStatus.blacklisted_until) > new Date()) {
        const untilDate = new Date(blacklistStatus.blacklisted_until).toLocaleDateString("ko-KR");
        throw new Error(`블랙리스트로 인해 프로그램 신청이 제한되었습니다. (${untilDate}까지)`);
      }

      const { data, error } = await supabase
        .from("applications")
        .insert([{
          program_id: parseInt(id),
          user_id: user.id,
          status: "pending"
        }])
        .select()
        .single();

      if (error) {
        console.error("Error applying to program:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-applications", id] });
      queryClient.invalidateQueries({ queryKey: ["user-application", id, user?.id] });
      toast.success("프로그램 신청이 완료되었습니다!");
    },
    onError: (error: any) => {
      console.error("Apply error:", error);
      toast.error(error.message || "프로그램 신청에 실패했습니다.");
    },
  });

  // 프로그램 신청 취소 뮤테이션
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!userApplication?.id) {
        throw new Error("신청 정보를 찾을 수 없습니다.");
      }

      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("id", userApplication.id);

      if (error) {
        console.error("Error canceling application:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-applications", id] });
      queryClient.invalidateQueries({ queryKey: ["user-application", id, user?.id] });
      toast.success("프로그램 신청이 취소되었습니다.");
    },
    onError: (error: any) => {
      console.error("Cancel error:", error);
      toast.error("신청 취소에 실패했습니다.");
    },
  });

  if (programLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">프로그램을 찾을 수 없습니다</h1>
            <Button onClick={() => navigate("/programs")}>
              프로그램 목록으로 돌아가기
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "미정";
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getStatus = () => {
    if (!program.start_at || !program.end_at) return "미정";
    const now = new Date();
    const startDate = new Date(program.start_at);
    const endDate = new Date(program.end_at);
    
    if (now < startDate) return "모집중";
    if (now >= startDate && now <= endDate) return "진행중";
    return "완료";
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "모집중":
        return "default";
      case "마감":
        return "destructive";
      case "진행중":
        return "secondary";
      default:
        return "outline";
    }
  };

  const status = getStatus();
  const isApplicationOpen = status === "모집중" && applicationCount < (program.capacity || 0);
  const hasApplied = !!userApplication;
  
  // 블랙리스트 체크
  const isBlacklisted = blacklistStatus && 
    blacklistStatus.is_active && 
    new Date(blacklistStatus.blacklisted_until) > new Date();

  const handleApplyAction = () => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      navigate("/auth");
      return;
    }

    if (isBlacklisted) {
      const untilDate = new Date(blacklistStatus.blacklisted_until).toLocaleDateString("ko-KR");
      toast.error(`블랙리스트로 인해 프로그램 신청이 제한되었습니다. (${untilDate}까지)`, {
        duration: 5000,
      });
      return;
    }

    if (hasApplied) {
      cancelMutation.mutate();
    } else {
      applyMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* 뒤로가기 버튼 */}
        <Button
          variant="ghost"
          className="mb-6 p-2"
          onClick={() => navigate("/programs")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          프로그램 목록으로
        </Button>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* 프로그램 이미지 및 기본 정보 */}
          <Card>
            <div className="relative h-64 md:h-80 overflow-hidden rounded-t-lg">
              {program.image_url ? (
                <img
                  src={program.image_url}
                  alt={program.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <div className="w-20 h-20 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center">
                      <Calendar className="w-10 h-10 text-primary" />
                    </div>
                    <p className="text-lg font-medium">{program.category || "프로그램"}</p>
                  </div>
                </div>
              )}
              <div className="absolute top-4 left-4">
                <Badge variant={getStatusVariant(status)} className="text-sm font-medium">
                  {status}
                </Badge>
              </div>
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="bg-background/90 text-foreground text-sm">
                  {program.category || "미분류"}
                </Badge>
              </div>
            </div>

            <CardHeader>
              <CardTitle className="text-3xl font-bold">{program.title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* 프로그램 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="w-5 h-5 mr-3 flex-shrink-0 text-primary" />
                  <span className="font-medium">지역:</span>
                  <span className="ml-2">{program.region || "지역 미정"}</span>
                </div>

                <div className="flex items-start text-muted-foreground">
                  <Calendar className="w-5 h-5 mr-3 flex-shrink-0 text-primary" />
                  <div>
                    <span className="font-medium">기간:</span>
                    <div className="ml-2 mt-1 text-foreground">
                      <div>{formatDate(program.start_at)} ~</div>
                      <div className="mt-1">{formatDate(program.end_at)}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-muted-foreground">
                  <Users className="w-5 h-5 mr-3 flex-shrink-0 text-primary" />
                  <span className="font-medium">정원:</span>
                  <span className="ml-2">{applicationCount}/{program.capacity || 0}명</span>
                </div>

                <div className="flex items-center text-muted-foreground">
                  <Clock className="w-5 h-5 mr-3 flex-shrink-0 text-primary" />
                  <span className="font-medium">상태:</span>
                  <Badge variant={getStatusVariant(status)} className="ml-2">
                    {status}
                  </Badge>
                </div>
              </div>

              {/* 진행률 바 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-muted-foreground">신청 현황</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round((applicationCount / (program.capacity || 1)) * 100)}%
                  </span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.min((applicationCount / (program.capacity || 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <Separator />

              {/* 프로그램 설명 */}
              <div>
                <h3 className="text-xl font-semibold mb-4">프로그램 소개</h3>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {program.description || "프로그램에 대한 상세한 설명이 준비되지 않았습니다."}
                  </p>
                </div>
              </div>

              {/* 신청 버튼 */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {user && hasApplied && (
                  <div className="flex items-center text-green-600 text-sm">
                    <User className="w-4 h-4 mr-2" />
                    이미 신청한 프로그램입니다
                  </div>
                )}
                
                {user && isBlacklisted && (
                  <div className="flex items-center text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                    <Ban className="w-4 h-4 mr-2" />
                    블랙리스트로 인해 신청이 제한되었습니다 ({new Date(blacklistStatus.blacklisted_until).toLocaleDateString("ko-KR")}까지)
                  </div>
                )}
                
                {user ? (
                  <Button 
                    className={`flex-1 sm:max-w-xs h-12 ${isBlacklisted ? "border-red-500 text-red-600 bg-red-50" : ""}`}
                    disabled={
                      isBlacklisted || 
                      (!isApplicationOpen && !hasApplied) || 
                      applyMutation.isPending || 
                      cancelMutation.isPending ||
                      isBlacklistLoading
                    }
                    onClick={handleApplyAction}
                    variant={
                      isBlacklisted 
                        ? "outline" 
                        : hasApplied 
                        ? "outline" 
                        : isApplicationOpen 
                        ? "default" 
                        : "secondary"
                    }
                  >
                    {isBlacklistLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        확인 중...
                      </>
                    ) : applyMutation.isPending || cancelMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    {isBlacklisted 
                      ? (
                        <>
                          <Ban className="w-4 h-4 mr-2" />
                          신청 제한 (블랙리스트)
                        </>
                      ) : hasApplied 
                      ? "신청 취소" 
                      : isApplicationOpen 
                      ? "신청하기" 
                      : status === "완료" 
                      ? "종료된 프로그램" 
                      : "신청불가"
                    }
                  </Button>
                ) : (
                  <Button 
                    className="flex-1 sm:max-w-xs h-12"
                    onClick={() => navigate('/auth')}
                    variant="outline"
                  >
                    로그인 후 신청하기
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProgramDetail;