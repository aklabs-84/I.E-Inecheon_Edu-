import { useState } from "react";
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Download, FileText, TrendingUp } from "lucide-react";
import { Survey, SurveyResponse, useSurveyResponses } from "@/hooks/useSurveys";
import { exportSurveyResultsXLSX } from "@/utils/surveyExcelExport";
import { toast } from "sonner";

interface SurveyResultsProps {
  survey: Survey;
  programTitle: string;
}

export const SurveyResults = ({ survey, programTitle }: SurveyResultsProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const { data: responses = [] } = useSurveyResponses(survey.id);

  const handleExportToExcel = async () => {
    setIsExporting(true);
    try {
      await exportSurveyResultsXLSX({
        surveyTitle: survey.title.replace(/00 0000/g, programTitle),
        programTitle,
        responses,
      });
      toast.success("설문 결과가 엑셀로 내보내기 되었습니다!");
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("엑셀 내보내기 중 오류가 발생했습니다.");
    } finally {
      setIsExporting(false);
    }
  };

  // 만족도 통계 계산
  const satisfactionStats = [];
  for (let i = 0; i < 7; i++) {
    const questionResponses = responses.map(r => parseInt(r.responses[`satisfaction_${i}`]) || 0).filter(v => v > 0);
    if (questionResponses.length > 0) {
      const average = questionResponses.reduce((a, b) => a + b, 0) / questionResponses.length;
      const distribution = [1, 2, 3, 4, 5].map(score => 
        questionResponses.filter(r => r === score).length
      );
      
      satisfactionStats.push({
        question: i + 1,
        average: average.toFixed(1),
        responses: questionResponses.length,
        distribution,
      });
    }
  }

  const chartData = satisfactionStats.map(stat => ({
    question: `문항 ${stat.question}`,
    average: parseFloat(stat.average),
  }));

  const getGenderBadge = (gender: string) => {
    return gender === "male" ? (
      <Badge variant="secondary">남</Badge>
    ) : (
      <Badge variant="outline">여</Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              설문 결과 - {survey.title.replace(/00 0000/g, programTitle)}
            </CardTitle>
            <Button
              onClick={handleExportToExcel}
              disabled={isExporting || responses.length === 0}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isExporting ? "엑셀 생성중..." : "엑셀 출력"}
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            총 {responses.length}명이 응답하였습니다.
          </div>
        </CardHeader>
      </Card>

      {responses.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">아직 응답이 없습니다</p>
              <p className="text-sm">설문 응답이 제출되면 여기에 결과가 표시됩니다.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 만족도 평균 차트 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                만족도 평균 점수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="question" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip
                    formatter={(value) => [`${value}점`, "평균 점수"]}
                  />
                  <Bar dataKey="average" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 응답자 목록 */}
          <Card>
            <CardHeader>
              <CardTitle>응답자 목록</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">번호</TableHead>
                    <TableHead>이름</TableHead>
                    <TableHead>소속</TableHead>
                    <TableHead>성별</TableHead>
                    <TableHead>나이</TableHead>
                    <TableHead>응답일시</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.map((response, index) => (
                    <TableRow key={response.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{response.profiles?.name || "이름 없음"}</TableCell>
                      <TableCell>{response.responses.institution || "-"}</TableCell>
                      <TableCell>
                        {response.responses.gender ? getGenderBadge(response.responses.gender) : "-"}
                      </TableCell>
                      <TableCell>{response.responses.age || "-"}</TableCell>
                      <TableCell>
                        {new Date(response.created_at).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 만족도 통계 */}
          <Card>
            <CardHeader>
              <CardTitle>문항별 만족도 통계</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {satisfactionStats.map((stat, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">문항 {stat.question}</h4>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          평균: <span className="font-semibold text-primary">{stat.average}점</span>
                        </span>
                        <span className="text-sm text-muted-foreground">
                          응답: {stat.responses}명
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-sm">
                      {["매우 불만", "불만", "보통", "만족", "매우 만족"].map((label, idx) => (
                        <div key={idx} className="text-center">
                          <div className="font-medium">{stat.distribution[idx]}명</div>
                          <div className="text-muted-foreground">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};