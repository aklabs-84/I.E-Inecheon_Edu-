import { useState } from "react";
import * as React from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import ProgramForm from "@/components/ProgramForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Users, Calendar, MapPin, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { usePrograms, useDeleteProgram, Program } from "@/hooks/usePrograms";
import { useProgramApplications } from "@/hooks/useApplications";
import ApplicationsList from "@/components/ApplicationsList";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Footer";

const AdminPrograms = () => {
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [elevating, setElevating] = useState(false);
  const [requesting, setRequesting] = useState(false);
  
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: programs = [], isLoading, error } = usePrograms(true); // 내가 작성한 프로그램만
  const deleteProgram = useDeleteProgram();
  const applicationCounts = useProgramApplications(programs.map(p => p.id));

  useEffect(() => {
    document.title = "프로그램 관리 - 인천 Connect Hub";
  }, []);

  // Check admin status (including super admin)
  React.useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      
      try {
        // Check both admin and super admin status
        const [{ data: isAdminData, error: adminError }, { data: isSuperAdminData, error: superAdminError }] = await Promise.all([
          supabase.rpc('is_admin', { uid: user.id }),
          supabase.rpc('is_super_admin', { uid: user.id })
        ]);
        
        if (adminError) console.error('Error checking admin status:', adminError);
        if (superAdminError) console.error('Error checking super admin status:', superAdminError);
        
        // User is considered admin if they have either admin or super admin role
        const hasAdminAccess = isAdminData || isSuperAdminData;
        setIsAdmin(hasAdminAccess);
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  const handleElevate = async () => {
    setElevating(true);
    try {
      const { error } = await supabase.rpc('elevate_to_admin');
      if (error) throw error;
      const { data, error: checkError } = await supabase.rpc('is_admin', { uid: user.id });
      if (checkError) throw checkError;
      setIsAdmin(!!data);
    } catch (err) {
      console.error('관리자 권한 요청 실패:', err);
      alert('관리자 권한 설정에 실패했습니다. Supabase에서 profiles.role을 admin으로 변경해 주세요.');
    } finally {
      setElevating(false);
    }
  };

  const handleRequestAdmin = async () => {
    setRequesting(true);
    try {
      const { error } = await supabase.rpc('request_admin_role');
      if (error) throw error;
      alert('관리자 권한 요청이 등록되었습니다. 슈퍼관리자의 검토를 기다려주세요.');
    } catch (err: any) {
      alert(err.message || '요청 처리에 실패했습니다.');
    } finally {
      setRequesting(false);
    }
  };

  console.log("AdminPrograms render - programs:", programs);
  console.log("AdminPrograms render - isLoading:", isLoading);
  console.log("AdminPrograms render - error:", error);

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

  const getStatus = (program: Program) => {
    // 수동으로 완료 처리된 경우
    if (program.status === 'completed') return "완료";
    if (program.status === 'cancelled') return "취소";
    
    if (!program.start_at || !program.end_at) return "미정";
    const now = new Date();
    const startDate = new Date(program.start_at);
    const endDate = new Date(program.end_at);
    
    if (now < startDate) return "모집중";
    if (now >= startDate && now <= endDate) return "진행중";
    return "완료";
  };

  const getCurrentApplicants = (programId: number) => {
    return applicationCounts.data?.[programId] || 0;
  };

  const handleAddProgram = () => {
    setSelectedProgram(null);
    setIsFormOpen(true);
  };

  const handleEditProgram = (program: Program) => {
    setSelectedProgram(program);
    setIsFormOpen(true);
  };

  const handleDeleteProgram = (id: number) => {
    deleteProgram.mutate(id);
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

  // Show loading while checking auth or admin status
  if (authLoading || isAdmin === null || isLoading) {
    console.log("AdminPrograms - showing loading state");
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">권한을 확인하는 중...</span>
          </div>
        </main>
      </div>
    );
  }

  // Show access denied for non-admin users
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-muted-foreground">
                <div className="text-6xl mb-4">🔒</div>
                <h2 className="text-2xl font-bold mb-2">접근 권한이 없습니다</h2>
                <p className="mb-4">관리자 권한이 필요한 페이지입니다.</p>
                {user && (
                  <div className="space-y-3">
                    <p className="text-sm">개발 테스트용: 아래 버튼을 눌러 관리자 권한을 부여하거나, 콘솔에서 다음을 실행하세요.</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Button onClick={handleRequestAdmin} disabled={requesting}>
                        {requesting ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" />요청 중...</>) : '관리자 권한 요청하기'}
                      </Button>
                      <Button variant="outline" onClick={handleElevate} disabled={elevating}>
                        {elevating ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" />처리 중...</>) : '관리자 권한 받기 (개발용)'}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">실서비스에서는 슈퍼관리자 승인 후 접근 가능합니다.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (error) {
    console.log("AdminPrograms - showing error state:", error);
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center text-destructive">
            <p>프로그램을 불러오는 중 오류가 발생했습니다.</p>
            <p className="text-sm mt-2">Error: {error?.message || "Unknown error"}</p>
          </div>
        </main>
      </div>
    );
  }

  console.log("AdminPrograms - rendering main content with programs:", programs.length);
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header - 반응형 */}
        <div className="mb-6 md:mb-8 space-y-4 md:space-y-0 md:flex md:items-start md:justify-between">
          <div className="space-y-1 md:space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">내 프로그램 관리</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              내가 작성한 교육 프로그램을 관리할 수 있습니다
            </p>
          </div>
          
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddProgram} className="flex items-center gap-2 w-full md:w-auto">
                <Plus className="h-4 w-4" />
                프로그램 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedProgram ? "프로그램 편집" : "새 프로그램 추가"}
                </DialogTitle>
              </DialogHeader>
              <ProgramForm
                program={selectedProgram}
                onCancel={() => setIsFormOpen(false)}
                onSuccess={() => setIsFormOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats - 반응형 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <Card>
            <CardHeader className="pb-1 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                내 프로그램
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold">{programs.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-1 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                모집중
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold text-green-600">
                {programs.filter(p => getStatus(p) === "모집중").length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-1 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                진행중
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold text-blue-600">
                {programs.filter(p => getStatus(p) === "진행중").length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-1 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                총 신청자
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-2xl font-bold text-purple-600">
                {programs.reduce((total, p) => total + getCurrentApplicants(p.id), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Programs List */}
        <div className="space-y-4">
          {programs.map((program) => {
            const status = getStatus(program);
            const currentApplicants = getCurrentApplicants(program.id);
            return (
              <Card key={program.id} className="overflow-hidden">
                <CardContent className="p-4 md:p-6">
                  {/* 모바일: 세로 배치, 데스크톱: 가로 배치 */}
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                    <div className="flex-1 space-y-3">
                      {/* 제목과 배지 - 모바일에서 세로 정렬 */}
                      <div className="space-y-2">
                        <h3 className="text-lg md:text-xl font-semibold line-clamp-2">{program.title}</h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={getStatusVariant(status)} className="text-xs">
                            {status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{program.category || "미분류"}</Badge>
                        </div>
                      </div>
                      
                      {/* 설명 - 모바일에서 줄 제한 */}
                      <p className="text-muted-foreground text-sm line-clamp-2 md:line-clamp-1">{program.description || "설명 없음"}</p>
                      
                      {/* 정보 - 모바일에서 세로 배치 */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                          <span className="truncate">{program.region || "지역 미정"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                          <span className="truncate text-xs md:text-sm">
                            {formatDate(program.start_at)} ~ {formatDate(program.end_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">{currentApplicants}/{program.capacity || 0}명</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 버튼 그룹 - 모바일에서 전체 폭, 데스크톱에서 우측 정렬 */}
                    <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-2 lg:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/programs/${program.id}/manage`)}
                        className="text-blue-600 hover:text-blue-700 text-xs md:text-sm whitespace-nowrap"
                      >
                        <Users className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                        <span className="hidden sm:inline">신청자 관리</span>
                        <span className="sm:hidden">관리</span>
                      </Button>
                      
                      <div className="flex gap-2">
                        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditProgram(program)}
                              className="flex-1 sm:flex-none"
                            >
                              <Edit className="h-3 w-3 md:h-4 md:w-4" />
                              <span className="ml-1 sm:hidden">편집</span>
                            </Button>
                          </DialogTrigger>
                        </Dialog>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-destructive hover:text-destructive flex-1 sm:flex-none"
                            >
                              <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                              <span className="ml-1 sm:hidden">삭제</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>프로그램 삭제</AlertDialogTitle>
                              <AlertDialogDescription>
                                "{program.title}" 프로그램을 삭제하시겠습니까? 
                                이 작업은 되돌릴 수 없습니다.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>취소</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteProgram(program.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                삭제
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${program.capacity ? Math.min((currentApplicants / program.capacity) * 100, 100) : 0}%` 
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {programs.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">작성한 프로그램이 없습니다</p>
                <p className="text-sm">첫 번째 프로그램을 추가해보세요!</p>
              </div>
            </CardContent>
          </Card>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default AdminPrograms;