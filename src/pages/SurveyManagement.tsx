import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, FileText, BarChart3, Settings, Users } from "lucide-react";
import { useProgramSurveys, useCreateSurvey, useUpdateSurvey } from "@/hooks/useSurveys";
import { usePrograms } from "@/hooks/usePrograms";
import { SurveyResults } from "@/components/SurveyResults";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface SurveyManagementProps {
  programId?: number;
}

export default function SurveyManagement({ programId: propProgramId }: SurveyManagementProps = {}) {
  const { programId: paramProgramId } = useParams<{ programId: string }>();
  const programId = propProgramId || Number(paramProgramId);
  const { data: programs } = usePrograms();
  const program = programs?.find(p => p.id === programId);
  const { data: surveys = [] } = useProgramSurveys(programId);
  const createSurvey = useCreateSurvey();
  const updateSurvey = useUpdateSurvey();
  const { user } = useAuth();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    is_active: true,
  });

  const handleCreateSurvey = async () => {
    if (!formData.title.trim()) {
      toast.error("설문지 제목을 입력해주세요.");
      return;
    }

    try {
      // 기본 만족도 설문지 생성
      const defaultQuestions = [
        {
          id: "satisfaction_0",
          type: "radio" as const,
          question: "교육과정 운영 전반에 대한 만족도",
          options: ["매우 불만", "불만", "보통", "만족", "매우 만족"],
          required: true,
        },
        {
          id: "satisfaction_1", 
          type: "radio" as const,
          question: "교육시간의 적절성",
          options: ["매우 불만", "불만", "보통", "만족", "매우 만족"],
          required: true,
        },
        {
          id: "satisfaction_2",
          type: "radio" as const,
          question: "교육 수강 인원의 적절성", 
          options: ["매우 불만", "불만", "보통", "만족", "매우 만족"],
          required: true,
        },
        {
          id: "satisfaction_3",
          type: "radio" as const,
          question: "교육 프로그램 구성 만족도",
          options: ["매우 불만", "불만", "보통", "만족", "매우 만족"], 
          required: true,
        },
        {
          id: "satisfaction_4",
          type: "radio" as const,
          question: "강사의 준비성, 전문성",
          options: ["매우 불만", "불만", "보통", "만족", "매우 만족"],
          required: true,
        },
        {
          id: "satisfaction_5",
          type: "radio" as const,
          question: "프로그램 흥미/유익성",
          options: ["매우 불만", "불만", "보통", "만족", "매우 만족"],
          required: true,
        },
        {
          id: "satisfaction_6",
          type: "radio" as const,
          question: "앞으로 00 0000 수업이 있으면 계속 참여하거나 다른 사람에게 추천하시겠습니까?",
          options: ["매우 불만", "불만", "보통", "만족", "매우 만족"],
          required: true,
        },
      ];

      await createSurvey.mutateAsync({
        program_id: Number(programId),
        title: formData.title,
        description: formData.description,
        questions: defaultQuestions,
        is_active: formData.is_active,
      });

      setIsCreateModalOpen(false);
      setFormData({ title: "", description: "", is_active: true });
    } catch (error) {
      console.error("Survey creation error:", error);
    }
  };

  const handleToggleActive = async (survey: any) => {
    try {
      await updateSurvey.mutateAsync({
        id: survey.id,
        is_active: !survey.is_active,
      });
    } catch (error) {
      console.error("Survey update error:", error);
    }
  };

  if (showResults && selectedSurvey) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setShowResults(false)}
            className="mb-4"
          >
            ← 설문 관리로 돌아가기
          </Button>
        </div>
        <SurveyResults survey={selectedSurvey} programTitle={program?.title || ""} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">설문지 관리</h1>
        <p className="text-muted-foreground">
          프로그램: {program?.title}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="text-sm text-muted-foreground">
          총 {surveys.length}개의 설문지
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              설문지 생성
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 설문지 생성</DialogTitle>
              <DialogDescription>
                교육과정 및 강사 만족도 설문지를 생성합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">제목</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="예: 교육과정 및 강사 만족도 설문지 - 00 0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="설문지에 대한 설명을 입력하세요"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">설문 활성화</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleCreateSurvey} disabled={createSurvey.isPending}>
                  {createSurvey.isPending ? "생성 중..." : "생성"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {surveys.map((survey) => (
          <Card key={survey.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5" />
                  <div>
                    <CardTitle className="text-lg">
                      {survey.title.replace(/00 0000/g, program?.title || "")}
                    </CardTitle>
                    {survey.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {survey.description.replace(/00 0000/g, program?.title || "")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={survey.is_active ? "default" : "secondary"}>
                    {survey.is_active ? "활성" : "비활성"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  생성일: {new Date(survey.created_at).toLocaleDateString("ko-KR")}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      setSelectedSurvey(survey);
                      setShowResults(true);
                    }}
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    결과 보기
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => handleToggleActive(survey)}
                    disabled={updateSurvey.isPending}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    {survey.is_active ? "비활성화" : "활성화"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    asChild
                  >
                    <Link to={`/survey/${survey.id}`} target="_blank">
                      <Users className="h-4 w-4 mr-1" />
                      설문 페이지
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {surveys.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">설문지가 없습니다</p>
                <p className="text-sm">새 설문지를 생성하여 참가자들의 만족도를 조사해보세요.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}