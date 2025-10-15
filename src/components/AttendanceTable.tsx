import { useState, useRef } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar, Check, X, Clock, User, Download } from "lucide-react";
import { toast } from "sonner";
import { exportAttendanceXLSX } from "@/utils/excelExport";
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
import { SignatureModal } from "./SignatureModal";
import { useProgramApplicationsDetail } from "@/hooks/useApplications";
import { useProgramAttendance, useMarkAttendance } from "@/hooks/useAttendance";

interface AttendanceTableProps {
  programId: number;
  programTitle: string;
}

export const AttendanceTable = ({ programId, programTitle }: AttendanceTableProps) => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [signatureModal, setSignatureModal] = useState<{
    isOpen: boolean;
    userId?: string;
    userName?: string;
  }>({ isOpen: false });
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  const { data: applications = [] } = useProgramApplicationsDetail(programId);
  const { data: attendanceRecords = [] } = useProgramAttendance(programId, selectedDate);
  const markAttendance = useMarkAttendance();

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          출석부 - {programTitle}
        </CardTitle>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="attendance-date">출석 날짜:</Label>
              <Input
                id="attendance-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
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
            {isGeneratingExcel ? "엑셀 생성중..." : "엑셀 출력"}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
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