import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Check, X, Clock } from "lucide-react";
import { format, eachDayOfInterval, parseISO, isWeekend } from "date-fns";
import { ko } from "date-fns/locale";
import { useUserProgramAttendance } from "@/hooks/useUserAttendance";
import { getProgramCardColors } from "@/utils/programColors";

interface ClassStatusProps {
  programId: number;
  programTitle: string;
  startDate: string | null;
  endDate: string | null;
}

export const ClassStatus = ({ programId, programTitle, startDate, endDate }: ClassStatusProps) => {
  const { data: attendanceRecords = [] } = useUserProgramAttendance(programId);

  // 프로그램 ID를 기반으로 일관된 랜덤 색상 생성
  const cardColors = getProgramCardColors(programId);

  // 프로그램 수업일 계산 (주말 제외)
  const classDates = (() => {
    if (!startDate || !endDate) return [];
    
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const allDates = eachDayOfInterval({ start, end });
      return allDates.filter(date => !isWeekend(date));
    } catch (error) {
      console.error('날짜 파싱 오류:', error);
      return [];
    }
  })();

  // 출석 상태 조회 헬퍼
  const getAttendanceStatus = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return attendanceRecords.find(record => record.attendance_date === dateStr)?.status || null;
  };

  // 출석 상태 배지 컴포넌트
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

  // 출석률 계산
  const checkedDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(r => r.status === "present" || r.status === "late").length;
  const attendanceRate = checkedDays > 0 ? Math.round((presentDays / checkedDays) * 100) : 0;

  // 수업이 시작되지 않은 경우
  const now = new Date();
  const programStart = startDate ? parseISO(startDate) : null;
  
  if (programStart && now < programStart) {
    return (
      <Card className={cardColors}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            {programTitle} - 수업 상태
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">수업이 아직 시작되지 않았습니다</p>
            <p className="text-sm">수업 시작일: {format(programStart, "yyyy년 M월 d일", { locale: ko })}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (classDates.length === 0) {
    return (
      <Card className={cardColors}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            {programTitle} - 수업 상태
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">수업 일정이 설정되지 않았습니다</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cardColors}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5" />
          {programTitle} - 수업 상태
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 출석 통계 */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-blue-50/50 border-blue-200">
            <CardContent className="p-4">
              <div className="text-sm font-medium text-blue-600">전체 수업일</div>
              <div className="text-2xl font-bold text-blue-900">{classDates.length}일</div>
            </CardContent>
          </Card>
          <Card className="bg-indigo-50/50 border-indigo-200">
            <CardContent className="p-4">
              <div className="text-sm font-medium text-indigo-600">출석 체크일</div>
              <div className="text-2xl font-bold text-indigo-900">{checkedDays}일</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50/50 border-green-200">
            <CardContent className="p-4">
              <div className="text-sm font-medium text-green-600">출석률</div>
              <div className="text-2xl font-bold text-green-700">{attendanceRate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* 일별 출석 현황 */}
        <div>
          <h3 className="text-lg font-semibold mb-4">일별 출석 현황</h3>
          <div className="space-y-2">
            {classDates.map((date, index) => {
              const status = getAttendanceStatus(date);
              const isPast = date < now;
              
              return (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all hover:shadow-sm ${
                    isPast 
                      ? 'bg-white/70 border-gray-200/50 shadow-sm' 
                      : 'bg-gray-50/30 border-gray-300/50 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium">
                      {format(date, "M월 d일 (E)", { locale: ko })}
                    </div>
                    {!isPast && (
                      <Badge variant="outline" className="text-xs">
                        예정
                      </Badge>
                    )}
                  </div>
                  <div>
                    {isPast ? getStatusBadge(status) : (
                      <Badge variant="outline" className="text-xs">
                        -
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};