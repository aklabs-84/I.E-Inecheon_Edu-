import { useState, useRef, useMemo, useEffect } from "react";
import { format, eachDayOfInterval, parseISO, isWeekend } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar, Check, X, Clock, User, Download, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { exportAttendanceXLSX } from "@/utils/excelExport";
import { exportAttendanceSummaryXLSX } from "@/utils/attendanceExcelExport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignatureModal } from "./SignatureModal";
import { useProgramApplicationsDetail } from "@/hooks/useApplications";
import { useProgramAttendance, useMarkAttendance } from "@/hooks/useAttendance";
import { usePrograms } from "@/hooks/usePrograms";

interface AttendanceTableProps {
  programId: number;
  programTitle: string;
}

export const AttendanceTable = ({ programId, programTitle }: AttendanceTableProps) => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [activeTab, setActiveTab] = useState("daily");
  const [signatureModal, setSignatureModal] = useState<{
    isOpen: boolean;
    userId?: string;
    userName?: string;
  }>({ isOpen: false });
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  const { data: programs = [] } = usePrograms();
  const { data: applications = [] } = useProgramApplicationsDetail(programId);
  const { data: attendanceRecords = [] } = useProgramAttendance(programId, selectedDate);
  const { data: allAttendanceRecords = [] } = useProgramAttendance(programId); // 전체 출석 기록
  const markAttendance = useMarkAttendance();

  // 현재 프로그램 정보
  const currentProgram = programs.find(p => p.id === programId);

  // 프로그램 기간 중 출석 가능한 날짜들 계산 (주말 제외)
  const availableDates = useMemo(() => {
    if (!currentProgram?.start_at || !currentProgram?.end_at) return [];
    
    try {
      const startDate = parseISO(currentProgram.start_at);
      const endDate = parseISO(currentProgram.end_at);
      
      const allDates = eachDayOfInterval({ start: startDate, end: endDate });
      // 주말 제외 (필요시 주말도 포함하려면 이 필터 제거)
      return allDates.filter(date => !isWeekend(date));
    } catch (error) {
      console.error('날짜 파싱 오류:', error);
      return [];
    }
  }, [currentProgram]);

  // 실제 출석 체크된 기록 수 계산 (미체크 제외)
  const actualAttendanceCount = useMemo(() => {
    // 실제 출석/결석/지각으로 체크된 기록만 카운트
    return allAttendanceRecords.filter(record => 
      record.status === "present" || record.status === "absent" || record.status === "late"
    ).length;
  }, [allAttendanceRecords]);

  // 첫 수업일을 기본 선택 날짜로 설정
  useEffect(() => {
    if (availableDates.length > 0) {
      const firstClassDate = format(availableDates[0], "yyyy-MM-dd");
      const today = format(new Date(), "yyyy-MM-dd");
      
      // 오늘 날짜가 수업 날짜에 포함되어 있으면 오늘을, 아니면 첫 수업일을 선택
      const isValidDate = availableDates.some(date => format(date, "yyyy-MM-dd") === today);
      if (!isValidDate) {
        setSelectedDate(firstClassDate);
      }
    }
  }, [availableDates]);

  // 승인된 신청자만 필터링
  const approvedApplicants = applications.filter(app => app.status === "approved");

  // 출석 상태 조회 헬퍼
  const getAttendanceStatus = (userId: string) => {
    return attendanceRecords.find(record => record.user_id === userId)?.status || null;
  };

  const handleSignatureConfirm = (dataUrl: string) => {
    if (!signatureModal.userId) return;

    markAttendance.mutate({
      userId: signatureModal.userId,
      programId,
      date: selectedDate,
      status: "present",
      notes: dataUrl, // 서명 이미지를 notes에 저장
    });

    setSignatureModal({ isOpen: false });
  };

  const handleMarkAbsent = (userId: string) => {
    markAttendance.mutate({
      userId,
      programId,
      date: selectedDate,
      status: "absent",
    });
  };

  const handleMarkLate = (userId: string) => {
    markAttendance.mutate({
      userId,
      programId,
      date: selectedDate,
      status: "late",
    });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><Check className="h-3 w-3 mr-1" />출석</Badge>;
      case "absent":
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />결석</Badge>;
      case "late":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="h-3 w-3 mr-1" />지각</Badge>;
      default:
        return <Badge variant="secondary">미체크</Badge>;
    }
  };

  const getStatusBadgeSmall = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">출</Badge>;
      case "absent":
        return <Badge variant="destructive" className="text-xs">결</Badge>;
      case "late":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-xs">지</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">-</Badge>;
    }
  };

  const handleExportToExcel = async () => {
    setIsGeneratingExcel(true);
    
    try {
      // 출석부 데이터 구성
      const rows = approvedApplicants.map((application, index) => {
        const profile = application.profiles;
        const attendanceStatus = getAttendanceStatus(application.user_id);
        let statusText: "출석" | "결석" | "지각" | "미체크" = "미체크";
        switch (attendanceStatus) {
          case 'present':
            statusText = '출석';
            break;
          case 'absent':
            statusText = '결석';
            break;
          case 'late':
            statusText = '지각';
            break;
        }
        // 해당 유저의 출석 레코드에서 notes(서명 이미지) 추출
        const signature = attendanceRecords.find(r => r.user_id === application.user_id)?.notes || '';
        return {
          no: index + 1,
          name: profile?.name || '이름 없음',
          nickname: profile?.nickname || '-',
          region: profile?.region || '-',
          status: statusText,
          signature,
          memo: ''
        };
      });

      await exportAttendanceXLSX({
        programTitle,
        selectedDate,
        rows,
      });
      
      toast.success("엑셀 파일이 성공적으로 생성되었습니다!");
      
    } catch (error) {
      console.error('엑셀 생성 오류:', error);
      toast.error('엑셀 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  const handleExportAttendanceSummary = async () => {
    setIsGeneratingExcel(true);
    
    try {
      // 출석 요약 데이터 구성
      const studentsData = approvedApplicants.map(application => {
        const profile = application.profiles;
        
        // 해당 학생의 모든 출석 기록
        const studentAttendance = availableDates.map(date => {
          const dateStr = format(date, "yyyy-MM-dd");
          const record = allAttendanceRecords.find(r => 
            r.user_id === application.user_id && r.attendance_date === dateStr
          );
          return {
            date: dateStr,
            status: record?.status || null
          };
        });

        // 출석률 계산 (체크된 날짜만 대상으로)
        const checkedDays = studentAttendance.filter(a => a.status !== null);
        const presentDays = checkedDays.filter(a => a.status === "present" || a.status === "late").length;
        const attendanceRate = checkedDays.length > 0 ? (presentDays / checkedDays.length) * 100 : 0;

        return {
          id: application.user_id,
          name: profile?.name || '이름 없음',
          nickname: profile?.nickname || '-',
          region: profile?.region || '-',
          attendance: studentAttendance,
          attendanceRate
        };
      });

      await exportAttendanceSummaryXLSX({
        programTitle,
        students: studentsData,
        programDates: availableDates,
      });
      
      toast.success("출석 현황 엑셀 파일이 성공적으로 생성되었습니다!");
      
    } catch (error) {
      console.error('엑셀 생성 오류:', error);
      toast.error('엑셀 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          출석부 - {programTitle}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily">일별 출석 관리</TabsTrigger>
            <TabsTrigger value="overview">전체 출석 현황</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="attendance-date">출석 날짜:</Label>
                  <Select value={selectedDate} onValueChange={setSelectedDate}>
                    <SelectTrigger className="w-auto min-w-[200px]">
                      <SelectValue placeholder="날짜를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDates.map((date) => (
                        <SelectItem key={format(date, "yyyy-MM-dd")} value={format(date, "yyyy-MM-dd")}>
                          {format(date, "yyyy년 M월 d일 (EEEE)", { locale: ko })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                  총 {approvedApplicants.length}명 등록
                </div>
              </div>
              
              <Button
                onClick={handleExportToExcel}
                disabled={isGeneratingExcel || approvedApplicants.length === 0}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isGeneratingExcel ? "엑셀 생성중..." : "일일 출석부 엑셀"}
              </Button>
            </div>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400&display=swap');
            .pdf-korean-text * {
              font-family: 'Noto Sans KR', sans-serif !important;
            }
          `}
        </style>
        {approvedApplicants.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">등록된 참여자가 없습니다</p>
            <p className="text-sm">프로그램 신청이 승인된 후 출석부에 표시됩니다.</p>
          </div>
        ) : (
          <div className="space-y-4" ref={tableRef}>
            <div className="text-sm text-muted-foreground">
              {format(new Date(selectedDate), "yyyy년 M월 d일 EEEE", { locale: ko })} 출석현황
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">번호</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>닉네임</TableHead>
                  <TableHead>지역</TableHead>
                  <TableHead className="w-32">출석상태</TableHead>
                  <TableHead className="w-48">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedApplicants.map((application, index) => {
                  const profile = application.profiles;
                  const attendanceStatus = getAttendanceStatus(application.user_id);
                  
                  return (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{profile?.name || "이름 없음"}</TableCell>
                      <TableCell>{profile?.nickname || "-"}</TableCell>
                      <TableCell>{profile?.region || "-"}</TableCell>
                      <TableCell>
                        {getStatusBadge(attendanceStatus)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {attendanceStatus !== "present" && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => setSignatureModal({
                                isOpen: true,
                                userId: application.user_id,
                                userName: profile?.name || "참여자"
                              })}
                            >
                              출석
                            </Button>
                          )}
                          {attendanceStatus !== "late" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkLate(application.user_id)}
                            >
                              지각
                            </Button>
                          )}
                          {attendanceStatus !== "absent" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleMarkAbsent(application.user_id)}
                            >
                              결석
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
          </TabsContent>

          <TabsContent value="overview" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                <h3 className="text-lg font-semibold">전체 출석 현황</h3>
              </div>
              
              <Button
                onClick={handleExportAttendanceSummary}
                disabled={isGeneratingExcel || approvedApplicants.length === 0}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isGeneratingExcel ? "엑셀 생성중..." : "전체 현황 엑셀"}
              </Button>
            </div>

            {availableDates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">프로그램 일정이 설정되지 않았습니다</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-muted-foreground">전체 수업일</div>
                      <div className="text-2xl font-bold">{availableDates.length}일</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-muted-foreground">등록 학생</div>
                      <div className="text-2xl font-bold">{approvedApplicants.length}명</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-muted-foreground">총 출석 기록</div>
                      <div className="text-2xl font-bold">{actualAttendanceCount}건</div>
                    </CardContent>
                  </Card>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">번호</TableHead>
                      <TableHead>이름</TableHead>
                      <TableHead>닉네임</TableHead>
                      <TableHead>지역</TableHead>
                      {availableDates.map((date) => (
                        <TableHead key={format(date, "yyyy-MM-dd")} className="text-center w-20">
                          {format(date, "M/d", { locale: ko })}
                        </TableHead>
                      ))}
                      <TableHead className="text-center">출석률</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedApplicants.map((application, index) => {
                      const profile = application.profiles;
                      const userAttendanceRecords = allAttendanceRecords.filter(
                        record => record.user_id === application.user_id
                      );
                      
                      // 출석률 계산
                      const presentCount = userAttendanceRecords.filter(r => r.status === 'present').length;
                      const attendanceRate = availableDates.length > 0 
                        ? Math.round((presentCount / availableDates.length) * 100) 
                        : 0;
                      
                      return (
                        <TableRow key={application.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>{profile?.name || "이름 없음"}</TableCell>
                          <TableCell>{profile?.nickname || "-"}</TableCell>
                          <TableCell>{profile?.region || "-"}</TableCell>
                          {availableDates.map((date) => {
                            const dateStr = format(date, "yyyy-MM-dd");
                            const record = userAttendanceRecords.find(
                              r => r.attendance_date === dateStr
                            );
                            
                            return (
                              <TableCell key={dateStr} className="text-center">
                                {record ? getStatusBadgeSmall(record.status) : (
                                  <Badge variant="secondary" className="text-xs">-</Badge>
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center">
                            <Badge 
                              variant={attendanceRate >= 80 ? "default" : attendanceRate >= 60 ? "secondary" : "destructive"}
                              className="text-xs"
                            >
                              {attendanceRate}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <SignatureModal
        isOpen={signatureModal.isOpen}
        onClose={() => setSignatureModal({ isOpen: false })}
        onConfirm={handleSignatureConfirm}
        studentName={signatureModal.userName || "참여자"}
      />
    </Card>
  );
};