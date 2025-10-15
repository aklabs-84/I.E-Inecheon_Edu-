import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, Clock, FileText, X, Loader2, ClipboardCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useMyApplications, useCancelApplication } from "@/hooks/useApplications";
import { useProgramSurveys, useUserSurveyResponse } from "@/hooks/useSurveys";
import { useProgramConsent, useUserConsentSubmission } from "@/hooks/useConsent";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useEffect } from "react";
import Footer from "@/components/Footer";

// ConsentButton 컴포넌트
const ConsentButton = ({ programId, program }: { programId: number; program: any }) => {
  const navigate = useNavigate();
  const { data: consentForm } = useProgramConsent(programId);
  const { data: existingSubmission } = useUserConsentSubmission(consentForm?.id || 0);

  // 동의서가 없거나 비활성화된 경우
  if (!consentForm || !consentForm.is_active) return null;

  // 수업 시작일 체크 - 수업 시작일 이후부터 표시
  const now = new Date();
  const startDate = program.start_at ? new Date(program.start_at) : null;
  
  // 수업이 시작되지 않았으면 버튼을 표시하지 않음
  if (startDate && now < startDate) return null;

  const isCompleted = !!existingSubmission;

  return (
    <Button 
      variant={isCompleted ? "secondary" : "default"} 
      size="sm"
      disabled={isCompleted}
      onClick={() => {
        if (programId && !isCompleted) {
          navigate(`/consent/${programId}`);
        }
      }}
      className={isCompleted ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50" : "bg-orange-600 hover:bg-orange-700"}
    >
      <FileText className="h-4 w-4 mr-1" />
      {isCompleted ? "동의서 완료" : "동의서 작성"}
    </Button>
  );
};

// SurveyButton 컴포넌트
const SurveyButton = ({ programId, program }: { programId: number; program: any }) => {
  const navigate = useNavigate();
  const { data: surveys, isLoading, error } = useProgramSurveys(programId);
  
  const activeSurvey = surveys?.find(survey => survey.is_active);
  
  // Always call hooks - pass activeSurvey.id or 0 when no active survey
  const { data: existingResponse } = useUserSurveyResponse(activeSurvey?.id || 0);
  
  if (isLoading) {
    return null;
  }
  
  if (!activeSurvey) {
    return null;
  }

  // 수업 완료일 체크 - 수업 완료일 이후부터 표시
  const now = new Date();
  const endDate = program.end_at ? new Date(program.end_at) : null;
  
  // 수업이 완료되지 않았으면 버튼을 표시하지 않음
  if (endDate && now < endDate) return null;
  
  const isCompleted = !!existingResponse;
  
  return (
    <Button 
      variant={isCompleted ? "secondary" : "default"} 
      size="sm"
      disabled={isCompleted}
      onClick={() => {
        if (activeSurvey?.id && !isCompleted) {
          navigate(`/survey/${activeSurvey.id}`);
        }
      }}
      className={isCompleted ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50" : "bg-green-600 hover:bg-green-700"}
    >
      <ClipboardCheck className="h-4 w-4 mr-1" />
      {isCompleted ? "설문 완료" : "설문 작성"}
    </Button>
  );
};

const Applications = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: applications = [], isLoading } = useMyApplications();
  const cancelMutation = useCancelApplication();

  useEffect(() => {
    document.title = "내 신청 현황 - 인천 Connect Hub";
  }, []);

  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // 로딩 중이거나 인증되지 않은 경우
  if (loading || !user) {
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

  // 프로그램 상태 계산
  const getStatus = (program: any) => {
    if (!program.start_at || !program.end_at) return "미정";
    const now = new Date();
    const startDate = new Date(program.start_at);
    const endDate = new Date(program.end_at);
    
    if (now < startDate) return "예정";
    if (now >= startDate && now <= endDate) return "진행중";
    return "완료";
  };

  // 신청 상태별 필터링
  const currentApplications = applications.filter(app => {
    const programStatus = getStatus(app.programs);
    return programStatus !== "완료";
  });

  const completedApplications = applications.filter(app => {
    const programStatus = getStatus(app.programs);
    return programStatus === "완료";
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "미정";
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getApplicationStatusVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getApplicationStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
  return "신청완료";
      case "pending":
        return "대기중";
      case "rejected":
        return "거절됨";
      default:
        return "신청완료";
    }
  };

  const handleCancelApplication = async (applicationId: number) => {
    if (window.confirm("정말로 신청을 취소하시겠습니까?")) {
      cancelMutation.mutate(applicationId);
    }
  };

  if (isLoading) {
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">내 신청</h1>
          <p className="text-muted-foreground">
            신청한 프로그램의 현황을 확인하고 관리하세요
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">총 신청</span>
              </div>
              <div className="text-2xl font-bold text-foreground mt-2">
                {applications.length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Badge className="h-4 w-4 bg-green-500" />
                <span className="text-sm font-medium text-muted-foreground">신청완료</span>
              </div>
              <div className="text-2xl font-bold text-foreground mt-2">
                {applications.filter(app => app.status === "approved").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-muted-foreground">대기중</span>
              </div>
              <div className="text-2xl font-bold text-foreground mt-2">
                {applications.filter(app => app.status === "pending").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Badge className="h-4 w-4 bg-blue-500" />
                <span className="text-sm font-medium text-muted-foreground">완료됨</span>
              </div>
              <div className="text-2xl font-bold text-foreground mt-2">
                {completedApplications.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Different Status */}
        <Tabs defaultValue="current" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="current">현재 신청</TabsTrigger>
            <TabsTrigger value="completed">완료된 프로그램</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {currentApplications.length > 0 ? (
              currentApplications.map((application) => (
                <Card key={application.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{application.programs.title}</CardTitle>
                        <Badge variant={getApplicationStatusVariant(application.status)}>
                          {getApplicationStatusLabel(application.status)}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="w-fit">
                        {application.programs.category || "미분류"}
                      </Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground"
                      onClick={() => handleCancelApplication(application.id)}
                      disabled={cancelMutation.isPending}
                    >
                      {cancelMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {application.programs.description || "설명이 없습니다."}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDate(application.programs.start_at)} ~ {formatDate(application.programs.end_at)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{application.programs.region || "지역 미정"}</span>
                        </div>

                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>
                            정원: {application.programs.capacity || 0}명
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span>신청일: {formatDate(application.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/programs/${application.programs.id}`)}
                        >
                          상세보기
                        </Button>
                        {application.status === "approved" && (
                          <div className="flex gap-2">
                            <SurveyButton programId={application.programs.id} program={application.programs} />
                            <ConsentButton programId={application.programs.id} program={application.programs} />
                          </div>
                        )}
                        {application.status === "pending" && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleCancelApplication(application.id)}
                            disabled={cancelMutation.isPending}
                          >
                            {cancelMutation.isPending ? "취소 중..." : "신청취소"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">아직 신청한 프로그램이 없습니다.</p>
                  <Button className="mt-4" onClick={() => navigate("/programs")}>
                    프로그램 둘러보기
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedApplications.length > 0 ? (
              completedApplications.map((application) => (
                <Card key={application.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg">{application.programs.title}</CardTitle>
                        <Badge variant="outline">{application.programs.category || "미분류"}</Badge>
                      </div>
                      <Badge variant="secondary">완료</Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>완료일: {formatDate(application.programs.end_at)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{application.programs.region || "지역 미정"}</span>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/programs/${application.programs.id}`)}
                        >
                          프로그램 보기
                        </Button>
                        {application.status === "approved" && (
                          <div className="flex gap-2">
                            <SurveyButton programId={application.programs.id} program={application.programs} />
                            <ConsentButton programId={application.programs.id} program={application.programs} />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Badge className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">완료된 프로그램이 없습니다.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Applications;