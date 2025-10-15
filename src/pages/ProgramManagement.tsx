import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, Calendar, FileText, Scroll, CheckCircle } from "lucide-react";
import { usePrograms, useCompleteProgram } from "@/hooks/usePrograms";
import ApplicationsList from "@/components/ApplicationsList";
import { AttendanceTable } from "@/components/AttendanceTable";
import { AttendanceStats } from "@/components/AttendanceStats";
import SurveyManagement from "@/pages/SurveyManagement";
import ConsentManagement from "@/components/ConsentManagement";

const ProgramManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const programId = parseInt(id || "0");
  
  const { data: programs = [] } = usePrograms(true);
  const program = programs.find(p => p.id === programId);
  const completeProgram = useCompleteProgram();

  useEffect(() => {
    if (program) {
      document.title = `${program.title} 관리 - 인천 Connect Hub`;
    } else {
      document.title = "프로그램 관리 - 인천 Connect Hub";
    }
  }, [program]);

  const handleCompleteProgram = () => {
    if (window.confirm("정말로 이 프로그램을 완료 처리하시겠습니까?")) {
      completeProgram.mutate(programId);
    }
  };

  const isCompleted = program?.status === 'completed';
                  `${new Date(program.start_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })} ~ ${new Date(program.end_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}`
  if (!program) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">프로그램을 찾을 수 없습니다</h1>
            <Button onClick={() => navigate("/admin/programs")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              프로그램 관리로 돌아가기
            </Button>
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
          <Button 
            variant="ghost" 
            onClick={() => navigate("/admin/programs")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            프로그램 관리로 돌아가기
          </Button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">{program.title}</h1>
              <p className="text-muted-foreground mt-1">{program.description}</p>
            </div>
            {!isCompleted && (
              <Button 
                onClick={handleCompleteProgram}
                variant="outline"
                className="flex items-center gap-2"
                disabled={completeProgram.isPending}
              >
                <CheckCircle className="h-4 w-4" />
                프로그램 완료
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{program.category}</span>
            <span>•</span>
            <span>{program.region}</span>
            <span>•</span>
            <span>
              {program.start_at && program.end_at ? (
                `${new Date(program.start_at).toLocaleString('ko-KR', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })} ~ ${new Date(program.end_at).toLocaleString('ko-KR', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })}`
              ) : (
                "일정 미정"
              )}
            </span>
            {isCompleted && (
              <>
                <span>•</span>
                <span className="text-green-600 font-medium">완료됨</span>
              </>
            )}
          </div>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              신청자 관리
            </TabsTrigger>
            <TabsTrigger value="consent" className="flex items-center gap-2">
              <Scroll className="h-4 w-4" />
              동의서
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              출석부
            </TabsTrigger>
            <TabsTrigger value="surveys" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              설문지
            </TabsTrigger>
            
          </TabsList>

          <TabsContent value="applications" className="space-y-6">
            <ApplicationsList 
              programId={programId} 
              programTitle={program.title}
            />
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <AttendanceTable 
              programId={programId} 
              programTitle={program.title}
            />
          </TabsContent>

          <TabsContent value="surveys" className="space-y-6">
            <SurveyManagement programId={programId} />
          </TabsContent>

          <TabsContent value="consent" className="space-y-6">
            <ConsentManagement programId={programId} />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default ProgramManagement;