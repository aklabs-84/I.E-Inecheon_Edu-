import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Users, TrendingUp, Calendar } from "lucide-react";
import { useAttendanceStats } from "@/hooks/useAttendance";

interface AttendanceStatsProps {
  programId: number;
}

export const AttendanceStats = ({ programId }: AttendanceStatsProps) => {
  const { data: stats, isLoading } = useAttendanceStats(programId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">통계를 불러오는 중...</div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 전체 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 등록자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplicants}명</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">출석률</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              총 출석 기록 기준
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 출석</CardTitle>
            <Badge className="bg-green-100 text-green-800">출석</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPresent}회</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 결석</CardTitle>
            <Badge variant="destructive">결석</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAbsent}회</div>
          </CardContent>
        </Card>
      </div>

      {/* 날짜별 통계 */}
      {Object.keys(stats.dateStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              날짜별 출석 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.dateStats)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([date, dayStat]) => {
                  const attendanceRate = dayStat.total > 0 
                    ? Math.round((dayStat.present / dayStat.total) * 100) 
                    : 0;

                  return (
                    <div key={date} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="font-medium">
                          {new Date(date).toLocaleDateString('ko-KR', {
                            month: 'long',
                            day: 'numeric',
                            weekday: 'short'
                          })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          총 {dayStat.total}명 기록
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex gap-2">
                          <Badge className="bg-green-100 text-green-800">
                            출석 {dayStat.present}
                          </Badge>
                          {dayStat.late > 0 && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              지각 {dayStat.late}
                            </Badge>
                          )}
                          {dayStat.absent > 0 && (
                            <Badge variant="destructive">
                              결석 {dayStat.absent}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm font-medium">
                          {attendanceRate}%
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 상태별 요약 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            출석 현황 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.totalPresent}</div>
              <div className="text-sm text-muted-foreground">총 출석</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.totalLate}</div>
              <div className="text-sm text-muted-foreground">총 지각</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.totalAbsent}</div>
              <div className="text-sm text-muted-foreground">총 결석</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};