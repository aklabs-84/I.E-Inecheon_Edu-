import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, Calendar, FileText, Scroll } from "lucide-react";
import { usePrograms } from "@/hooks/usePrograms";
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

  useEffect(() => {
    if (program) {
      document.title = `${program.title} 관리 - 인천 Connect Hub`;
    } else {
      document.title = "프로그램 관리 - 인천 Connect Hub";
    }
  }, [program]);
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
      
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/admin/programs")}
            className="mb-4 text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">프로그램 관리로 돌아가기</span>
            <span className="sm:hidden">돌아가기</span>
          </Button>
          
          <div className="space-y-3 sm:space-y-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                {program.title}
              </h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base line-clamp-2 sm:line-clamp-none">
                {program.description}
              </p>
            </div>
            
            {/* Program Info - Mobile Optimized */}
            <div className="space-y-2 sm:space-y-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                  {program.category}
                </span>
                <span className="bg-secondary/50 px-2 py-1 rounded-full text-xs">
                  {program.region}
                </span>
                {program?.status === 'completed' && (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                    완료됨
                  </span>
                )}
              </div>
              
              {/* Date Info - Stack on Mobile */}
              <div className="text-xs sm:text-sm text-muted-foreground">
                {program.start_at && program.end_at ? (
                  <div className="space-y-1 sm:space-y-0">
                    <div className="sm:inline">
                      <span className="font-medium">시작:</span>{' '}
                      {new Date(program.start_at).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </div>
                    <div className="sm:inline sm:ml-4">
                      <span className="font-medium">종료:</span>{' '}
                      {new Date(program.end_at).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </div>
                  </div>
                ) : (
                  "일정 미정"
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="applications" className="space-y-4 sm:space-y-6">
          {/* Mobile: Scrollable tabs */}
          <div className="sm:hidden">
            <TabsList className="w-full h-auto p-1 grid-cols-1 bg-muted/50">
              <div className="flex gap-1 overflow-x-auto pb-1">
                <TabsTrigger value="applications" className="flex-shrink-0 flex items-center gap-1 text-xs px-3 py-2">
                  <Users className="h-3 w-3" />
                  신청자
                </TabsTrigger>
                <TabsTrigger value="consent" className="flex-shrink-0 flex items-center gap-1 text-xs px-3 py-2">
                  <Scroll className="h-3 w-3" />
                  동의서
                </TabsTrigger>
                <TabsTrigger value="attendance" className="flex-shrink-0 flex items-center gap-1 text-xs px-3 py-2">
                  <Calendar className="h-3 w-3" />
                  출석부
                </TabsTrigger>
                <TabsTrigger value="surveys" className="flex-shrink-0 flex items-center gap-1 text-xs px-3 py-2">
                  <FileText className="h-3 w-3" />
                  설문지
                </TabsTrigger>
              </div>
            </TabsList>
          </div>
          
          {/* Desktop/Tablet: Grid tabs */}
          <div className="hidden sm:block">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
              <TabsTrigger value="applications" className="flex items-center gap-2 py-3">
                <Users className="h-4 w-4" />
                <span className="hidden md:inline">신청자 관리</span>
                <span className="md:hidden">신청자</span>
              </TabsTrigger>
              <TabsTrigger value="consent" className="flex items-center gap-2 py-3">
                <Scroll className="h-4 w-4" />
                <span className="hidden md:inline">동의서</span>
                <span className="md:hidden">동의서</span>
              </TabsTrigger>
              <TabsTrigger value="attendance" className="flex items-center gap-2 py-3">
                <Calendar className="h-4 w-4" />
                <span className="hidden md:inline">출석부</span>
                <span className="md:hidden">출석부</span>
              </TabsTrigger>
              <TabsTrigger value="surveys" className="flex items-center gap-2 py-3">
                <FileText className="h-4 w-4" />
                <span className="hidden md:inline">설문지</span>
                <span className="md:hidden">설문지</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="applications" className="space-y-4 sm:space-y-6">
            <ApplicationsList 
              programId={programId} 
              programTitle={program.title}
            />
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4 sm:space-y-6">
            <AttendanceTable 
              programId={programId} 
              programTitle={program.title}
            />
          </TabsContent>

          <TabsContent value="surveys" className="space-y-4 sm:space-y-6">
            <SurveyManagement programId={programId} />
          </TabsContent>

          <TabsContent value="consent" className="space-y-4 sm:space-y-6">
            <ConsentManagement programId={programId} />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default ProgramManagement;