import { useParams } from "react-router-dom";
import { useSurvey } from "@/hooks/useSurveys";
import { usePrograms } from "@/hooks/usePrograms";
import { useProgramApplicationsDetail } from "@/hooks/useApplications";
import { SurveyForm } from "@/components/SurveyForm";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Survey() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const { user } = useAuth();
  const { data: survey, isLoading: surveyLoading } = useSurvey(Number(surveyId));
  const { data: programs } = usePrograms();
  const program = programs?.find(p => p.id === survey?.program_id);
  const { data: applications } = useProgramApplicationsDetail(survey?.program_id || 0);
  
  // 현재 사용자의 신청 상태 확인
  const userApplication = applications?.find(app => app.user_id === user?.id);
  const isApproved = userApplication?.status === 'approved';
  const isCreator = program?.created_by === user?.id;

  const isLoading = surveyLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>설문지를 불러오는 중...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!survey || !program) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
                <h2 className="text-2xl font-bold mb-2">설문지를 찾을 수 없습니다</h2>
                <p className="text-muted-foreground">
                  요청하신 설문지가 존재하지 않거나 접근 권한이 없습니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // 승인된 신청자가 아니고 프로그램 생성자도 아닌 경우 접근 제한
  if (!isApproved && !isCreator) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Users className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
                <h2 className="text-2xl font-bold mb-2">설문 참여 권한이 없습니다</h2>
                <p className="text-muted-foreground mb-4">
                  이 설문은 <strong>{program.title}</strong> 프로그램에 승인된 참가자만 응답할 수 있습니다.
                </p>
                <p className="text-sm text-muted-foreground">
                  프로그램 신청 상태: {userApplication ? 
                    (userApplication.status === 'pending' ? '심사중' : 
                     userApplication.status === 'cancelled' ? '거절됨' : '미신청') 
                    : '미신청'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (!survey.is_active) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
                <h2 className="text-2xl font-bold mb-2">설문이 종료되었습니다</h2>
                <p className="text-muted-foreground">
                  이 설문은 현재 응답을 받지 않고 있습니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <SurveyForm survey={survey} programTitle={program.title} />
      </div>
      <Footer />
    </div>
  );
}