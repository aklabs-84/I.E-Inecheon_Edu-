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
import { 
  useProgramConsent, 
  useCreateConsent, 
  useUpdateConsent, 
  useConsentSubmissions 
} from "@/hooks/useConsent";
import { usePrograms } from "@/hooks/usePrograms";
import { ConsentResults } from "@/components/ConsentResults";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface ConsentManagementProps {
  programId?: number;
}

export default function ConsentManagement({ programId: propProgramId }: ConsentManagementProps = {}) {
  const { programId: paramProgramId } = useParams<{ programId: string }>();
  const programId = propProgramId || Number(paramProgramId);
  const { data: programs } = usePrograms();
  const program = programs?.find(p => p.id === programId);
  const { data: consentForm } = useProgramConsent(programId);
  const { data: submissions = [] } = useConsentSubmissions(consentForm?.id || 0);
  const createConsent = useCreateConsent();
  const updateConsent = useUpdateConsent();
  const { user } = useAuth();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    is_active: true,
  });

  const defaultContent = `개인정보 수집 및 활용 동의

1. 개인정보 수집 목적
   - 프로그램 참여자 관리 및 서비스 제공
   - 프로그램 운영을 위한 연락처 관리

2. 수집하는 개인정보 항목
   - 필수항목: 성명, 생년월일, 성별, 휴대폰번호, 거주동명, 학교/기관

3. 개인정보 보유 및 이용기간
   - 프로그램 종료 후 1년까지 보관
   - 보유기간 경과 시 지체없이 파기

4. 개인정보 수집 동의 거부권
   - 개인정보 수집에 동의하지 않을 권리가 있습니다.
   - 단, 동의 거부 시 프로그램 참여가 제한될 수 있습니다.`;

  const handleCreateConsent = async () => {
    if (!formData.title.trim()) {
      toast.error("동의서 제목을 입력해주세요.");
      return;
    }

    try {
      await createConsent.mutateAsync({
        programId: Number(programId),
        title: formData.title,
        content: formData.content || defaultContent,
        is_active: formData.is_active,
      });

      setIsCreateModalOpen(false);
      setFormData({ title: "", content: "", is_active: true });
      toast.success("동의서가 생성되었습니다.");
    } catch (error) {
      console.error("Consent creation error:", error);
    }
  };

  const handleToggleActive = async () => {
    if (!consentForm) return;
    
    try {
      await updateConsent.mutateAsync({
        id: consentForm.id,
        is_active: !consentForm.is_active,
      });
    } catch (error) {
      console.error("Consent update error:", error);
    }
  };

  if (showResults && consentForm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setShowResults(false)}
            className="mb-4"
          >
            ← 동의서 관리로 돌아가기
          </Button>
        </div>
        <ConsentResults consentForm={consentForm} programTitle={program?.title || ""} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">동의서 관리</h1>
        <p className="text-muted-foreground">
          프로그램: {program?.title}
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-muted-foreground">
          총 {consentForm ? 1 : 0}개의 동의서
        </div>
        
        {!consentForm && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                동의서 생성
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 동의서 생성</DialogTitle>
                <DialogDescription>
                  개인정보 수집 및 활용 동의서를 생성합니다.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">제목</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="예: 00 프로그램 수업 동의서"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">내용</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder={defaultContent}
                    rows={8}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">동의서 활성화</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={handleCreateConsent} disabled={createConsent.isPending}>
                    {createConsent.isPending ? "생성 중..." : "생성"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6">
        {consentForm && (
          <Card key={consentForm.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5" />
                  <div>
                    <CardTitle className="text-lg">
                      {consentForm.title.replace(/00/g, program?.title || "")}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      개인정보 수집 및 활용 동의
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={consentForm.is_active ? "default" : "secondary"}>
                    {consentForm.is_active ? "활성" : "비활성"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  생성일: {new Date(consentForm.created_at).toLocaleDateString("ko-KR")}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowResults(true)}
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    결과 보기
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleActive}
                    disabled={updateConsent.isPending}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    {consentForm.is_active ? "비활성화" : "활성화"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link to={`/consent/${programId}`} target="_blank">
                      <Users className="h-4 w-4 mr-1" />
                      동의서 페이지
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!consentForm && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">동의서가 없습니다</p>
                <p className="text-sm">새 동의서를 생성하여 참가자들의 개인정보 수집 동의를 받아보세요.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}