import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { useConsentSubmissions, type ConsentFormType } from "@/hooks/useConsent";
import { exportConsentXLSX } from "@/utils/consentExcelExport";
import { toast } from "sonner";

interface ConsentResultsProps {
  consentForm: ConsentFormType;
  programTitle: string;
}

export const ConsentResults = ({ consentForm, programTitle }: ConsentResultsProps) => {
  const { data: submissions = [] } = useConsentSubmissions(consentForm.id);

  const handleExportExcel = async () => {
    if (submissions.length === 0) {
      toast.error("내보낼 동의서 데이터가 없습니다.");
      return;
    }

    try {
      await exportConsentXLSX({
        programTitle,
        consentTitle: consentForm.title,
        consentContent: consentForm.content,
        submissions,
      });
      toast.success("엑셀 파일이 다운로드되었습니다.");
    } catch (error) {
      console.error("엑셀 내보내기 실패:", error);
      toast.error("엑셀 파일 생성에 실패했습니다.");
    }
  };

  const stats = {
    total: submissions.length,
    agreed: submissions.filter(s => s.agreed).length,
    disagreed: submissions.filter(s => !s.agreed).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">동의서 결과</h1>
          <p className="text-muted-foreground">
            {consentForm.title.replace(/00/g, programTitle)}
          </p>
        </div>
        {submissions.length > 0 && (
          <Button onClick={handleExportExcel} variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" />
            엑셀 다운로드
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-sm text-muted-foreground">총 제출</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.agreed}</div>
              <div className="text-sm text-muted-foreground">동의</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.disagreed}</div>
              <div className="text-sm text-muted-foreground">미동의</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.total > 0 ? Math.round((stats.agreed / stats.total) * 100) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">동의율</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>제출 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left">번호</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">성명</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">생년월일</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">성별</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">휴대폰</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">주소</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">학교/기관</th>
                    <th className="border border-gray-200 px-4 py-2 text-center">동의 여부</th>
                    <th className="border border-gray-200 px-4 py-2 text-center">제출일시</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission, index) => (
                    <tr key={submission.id}>
                      <td className="border border-gray-200 px-4 py-2">{index + 1}</td>
                      <td className="border border-gray-200 px-4 py-2">
                        {submission.name || submission.profiles?.name || "정보없음"}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {submission.birth_date ? new Date(submission.birth_date).toLocaleDateString("ko-KR") : ""}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {submission.gender === 'male' ? '남' : 
                         submission.gender === 'female' ? '여' : submission.gender || ''}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {submission.phone || ""}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {submission.address || ""}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {submission.institution || ""}
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-center">
                        <Badge variant={submission.agreed ? "default" : "destructive"}>
                          {submission.agreed ? "동의" : "미동의"}
                        </Badge>
                      </td>
                      <td className="border border-gray-200 px-4 py-2 text-center">
                        {new Date(submission.created_at).toLocaleDateString("ko-KR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              아직 제출된 동의서가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};