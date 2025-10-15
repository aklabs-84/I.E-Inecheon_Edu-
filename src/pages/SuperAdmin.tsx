import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Loader2, ShieldCheck, ShieldOff, ShieldX, UserMinus, FileText, Users, Calendar, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";

interface AdminRequestRow {
  id: string;
  user_id: string;
  requested_at: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  reason: string | null;
}

interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  role: string | null;
}

interface Program {
  id: number;
  title: string;
  category: string | null;
  region: string | null;
  description: string | null;
  start_at: string | null;
  end_at: string | null;
  capacity: number | null;
  created_at: string;
  created_by: string | null;
}

interface Application {
  id: number;
  user_id: string;
  program_id: number;
  status: string;
  created_at: string;
  profiles?: {
    id: string;
    name: string | null;
    email: string | null;
    nickname: string | null;
    age_group: string | null;
    gender: string | null;
    region: string | null;
    preferred_category: string | null;
    learning_purpose: string | null;
    available_time: string | null;
  };
}

const SuperAdmin = () => {
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<AdminRequestRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [actingId, setActingId] = useState<string | null>(null);
  const [adminProfiles, setAdminProfiles] = useState<Profile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [applications, setApplications] = useState<Record<number, Application[]>>({});
  const [expandedPrograms, setExpandedPrograms] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState("requests");
  const itemsPerPage = 10;

  // SEO minimal
  useEffect(() => {
    document.title = "관리자 - 인천에듀";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "슈퍼관리자가 관리자 요청을 승인/거절하고 전체 현황을 관리합니다.");
  }, []);

  useEffect(() => {
    const check = async () => {
      try {
        const { data, error } = await supabase.rpc("is_super_admin", { uid: user.id });
        if (error) throw error;
        setIsSuperAdmin(!!data);
      } catch (e) {
        setIsSuperAdmin(false);
      }
    };
    check();
  }, [user?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Only fetch pending requests for the admin request list
      const { data, error } = await supabase
        .from("admin_requests")
        .select("id,user_id,requested_at,status,reviewed_by,reviewed_at,reason")
        .eq("status", "pending")
        .order("requested_at", { ascending: false });
      if (error) throw error;
      const reqs = (data || []) as AdminRequestRow[];
      setRequests(reqs);

      // collect ids
      const ids = Array.from(
        new Set(
          reqs.flatMap((r) => [r.user_id, r.reviewed_by].filter(Boolean) as string[])
        )
      );
      if (ids.length) {
        const { data: profs, error: pErr } = await supabase
          .from("profiles")
          .select("id,email,name,role")
          .in("id", ids);
        if (pErr) throw pErr;
        const map: Record<string, Profile> = {};
        (profs || []).forEach((p) => (map[p.id] = p as Profile));
        setProfiles(map);
      } else {
        setProfiles({});
      }

      // Fetch current admin users
      const { data: adminData, error: adminErr } = await supabase
        .from("profiles")
        .select("id,email,name,role")
        .eq("role", "admin");
      if (adminErr) throw adminErr;
      setAdminProfiles((adminData || []) as Profile[]);
      
      // Fetch all programs
      const { data: programData, error: programErr } = await supabase
        .from("programs")
        .select("*")
        .order("created_at", { ascending: false });
      if (programErr) throw programErr;
      setPrograms((programData || []) as Program[]);
      
      // Fetch applications for all programs
      if (programData && programData.length > 0) {
        const { data: appData, error: appErr } = await supabase
          .from("applications")
          .select(`
            id,
            user_id,
            program_id,
            status,
            created_at,
            profiles:user_id (
              id,
              name,
              email,
              nickname,
              age_group,
              gender,
              region,
              preferred_category,
              learning_purpose,
              available_time
            )
          `)
          .order("created_at", { ascending: false });
        if (appErr) throw appErr;
        
        // Group applications by program_id
        const appsByProgram: Record<number, Application[]> = {};
        (appData || []).forEach((app) => {
          if (!appsByProgram[app.program_id]) {
            appsByProgram[app.program_id] = [];
          }
          appsByProgram[app.program_id].push(app as Application);
        });
        setApplications(appsByProgram);
      }
    } catch (e: any) {
      toast.error(e.message || "데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) fetchData();
  }, [isSuperAdmin]);

  const onReview = async (id: string, approve: boolean) => {
    setActingId(id);
    try {
      const { error } = await supabase.rpc("review_admin_request", {
        request_id: id,
        approve,
        review_reason: approve ? "슈퍼관리자 승인" : "정책에 따라 거절",
      });
      if (error) throw error;
      toast.success(approve ? "승인되었습니다" : "거절되었습니다");
      await fetchData();
    } catch (e: any) {
      toast.error(e.message || "처리 실패");
    } finally {
      setActingId(null);
    }
  };

  const onRevokeAdmin = async (userId: string, userName: string) => {
    if (!confirm(`${userName}의 관리자 권한을 취소하시겠습니까?`)) return;
    
    setActingId(userId);
    try {
      const { error } = await supabase.rpc("revoke_admin_role", {
        target_user_id: userId,
      });
      if (error) throw error;
      toast.success("관리자 권한이 취소되었습니다");
      await fetchData();
    } catch (e: any) {
      toast.error(e.message || "권한 취소 실패");
    } finally {
      setActingId(null);
    }
  };

  const pendingCount = useMemo(() => requests.length, [requests]);
  
  const toggleProgramExpansion = (programId: number) => {
    const newExpanded = new Set(expandedPrograms);
    if (newExpanded.has(programId)) {
      newExpanded.delete(programId);
    } else {
      newExpanded.add(programId);
    }
    setExpandedPrograms(newExpanded);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Pagination logic for admin requests
  const totalPages = Math.ceil(pendingCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = requests.slice(startIndex, endIndex);

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    // Previous button
    items.push(
      <PaginationItem key="prev">
        <PaginationPrevious 
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
        />
      </PaginationItem>
    );

    // Page numbers
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink onClick={() => setCurrentPage(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            onClick={() => setCurrentPage(i)} 
            isActive={currentPage === i}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => setCurrentPage(totalPages)} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Next button
    items.push(
      <PaginationItem key="next">
        <PaginationNext 
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
        />
      </PaginationItem>
    );

    return items;
  };

  if (isSuperAdmin === null || loading && requests.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">로딩 중...</span>
          </div>
        </main>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-muted-foreground">
                <div className="text-6xl mb-4">🔒</div>
                <h2 className="text-2xl font-bold mb-2">슈퍼관리자 전용 페이지</h2>
                <p>접근 권한이 없습니다.</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">슈퍼관리자 대시보드</h1>
            <p className="text-muted-foreground">관리자 요청 승인/거절 및 프로그램 현황 관리</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchData}>새로고침</Button>
            <span className="text-sm text-muted-foreground">대기 {pendingCount}건</span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="requests">관리자 요청</TabsTrigger>
            <TabsTrigger value="programs">프로그램 관리</TabsTrigger>
            <TabsTrigger value="admins">관리자 목록</TabsTrigger>
          </TabsList>

          <TabsContent value="requests">

        <Card>
          <CardHeader>
            <CardTitle>관리자 요청 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>
                {pendingCount > 0 
                  ? `총 ${pendingCount}개의 대기 중인 요청이 있습니다.` 
                  : "최근 요청이 상단에 표시됩니다."}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>요청자</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>요청일</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      대기 중인 관리자 요청이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRequests.map((r) => {
                    const u = profiles[r.user_id];
                    return (
                      <TableRow key={r.id}>
                        <TableCell>{u ? (u.name || '이름 없음') : r.user_id}</TableCell>
                        <TableCell>{u ? u.email : '-'}</TableCell>
                        <TableCell>{new Date(r.requested_at).toLocaleString("ko-KR")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="secondary" disabled={actingId===r.id} onClick={() => onReview(r.id, true)}>
                              {actingId===r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                              승인
                            </Button>
                            <Button size="sm" variant="destructive" disabled={actingId===r.id} onClick={() => onReview(r.id, false)}>
                              {actingId===r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
                              거절
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    {renderPaginationItems()}
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="programs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  프로그램 목록 및 신청자 현황
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {programs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      등록된 프로그램이 없습니다.
                    </div>
                  ) : (
                    programs.map((program) => {
                      const programApplications = applications[program.id] || [];
                      const isExpanded = expandedPrograms.has(program.id);
                      
                      return (
                        <Card key={program.id} className="border-l-4 border-l-primary">
                          <Collapsible>
                            <CollapsibleTrigger
                              className="w-full"
                              onClick={() => toggleProgramExpansion(program.id)}
                            >
                              <CardHeader className="hover:bg-muted/50 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="text-left">
                                      <CardTitle className="text-lg">{program.title}</CardTitle>
                                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                        <span className="flex items-center gap-1">
                                          <MapPin className="h-4 w-4" />
                                          {program.region}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Calendar className="h-4 w-4" />
                                          {program.start_at ? formatDate(program.start_at) : '시작일 미정'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Users className="h-4 w-4" />
                                          {programApplications.length}명 신청
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary">{program.category}</Badge>
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </div>
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent>
                              <CardContent className="pt-0">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                  {/* 프로그램 상세 정보 */}
                                  <div>
                                    <h4 className="font-semibold mb-3">프로그램 정보</h4>
                                    <div className="space-y-2 text-sm">
                                      <div><strong>설명:</strong> {program.description || '설명 없음'}</div>
                                      <div><strong>정원:</strong> {program.capacity || '미정'}명</div>
                                      <div><strong>시작일:</strong> {program.start_at ? formatDate(program.start_at) : '미정'}</div>
                                      <div><strong>종료일:</strong> {program.end_at ? formatDate(program.end_at) : '미정'}</div>
                                      <div><strong>등록일:</strong> {formatDate(program.created_at)}</div>
                                    </div>
                                  </div>
                                  
                                  {/* 신청자 목록 */}
                                  <div>
                                    <h4 className="font-semibold mb-3">신청자 목록 ({programApplications.length}명)</h4>
                                    {programApplications.length === 0 ? (
                                      <p className="text-muted-foreground text-sm">아직 신청자가 없습니다.</p>
                                    ) : (
                                      <div className="space-y-3 max-h-60 overflow-y-auto">
                                        {programApplications.map((app) => (
                                          <div key={app.id} className="border rounded p-3 bg-muted/30">
                                            <div className="flex items-center justify-between mb-2">
                                              <div className="font-medium">
                                                {app.profiles?.name || '이름 없음'}
                                              </div>
                                              <Badge className={getStatusColor(app.status)}>
                                                {app.status === 'pending' ? '대기중' : 
                                                 app.status === 'approved' ? '신청완료' : '거절됨'}
                                              </Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground space-y-1">
                                              <div><strong>이메일:</strong> {app.profiles?.email || '미제공'}</div>
                                              <div><strong>닉네임:</strong> {app.profiles?.nickname || '미제공'}</div>
                                              <div><strong>연령대:</strong> {app.profiles?.age_group || '미제공'}</div>
                                              <div><strong>성별:</strong> {app.profiles?.gender || '미제공'}</div>
                                              <div><strong>지역:</strong> {app.profiles?.region || '미제공'}</div>
                                              <div><strong>선호 카테고리:</strong> {app.profiles?.preferred_category || '미제공'}</div>
                                              <div><strong>학습 목적:</strong> {app.profiles?.learning_purpose || '미제공'}</div>
                                              <div><strong>가능 시간:</strong> {app.profiles?.available_time || '미제공'}</div>
                                              <div><strong>신청일:</strong> {formatDate(app.created_at)}</div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </CollapsibleContent>
                          </Collapsible>
                        </Card>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <CardTitle>현재 관리자 목록</CardTitle>
              </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>
                {adminProfiles.length > 0 
                  ? `현재 ${adminProfiles.length}명의 관리자가 있습니다.`
                  : "현재 관리자 권한을 가진 사용자들입니다."}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>권한</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminProfiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      현재 관리자 권한을 가진 사용자가 없습니다.
                      <br />
                      관리자 요청을 승인하여 사용자들에게 관리자 권한을 부여할 수 있습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  adminProfiles.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.name || '이름 없음'}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          관리자
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="destructive"
                          disabled={actingId === admin.id}
                          onClick={() => onRevokeAdmin(admin.id, admin.name || admin.email || '사용자')}
                        >
                          {actingId === admin.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserMinus className="h-4 w-4" />
                          )}
                          승인 취소
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default SuperAdmin;
