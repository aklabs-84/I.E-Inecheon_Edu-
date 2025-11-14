import { useParams, Navigate } from "react-router-dom";
import Header from "@/components/Header";
import { ConsentFormComponent } from "@/components/ConsentForm";
import { useProgramConsent } from "@/hooks/useConsent";
import { usePrograms } from "@/hooks/usePrograms";
import { Loader2 } from "lucide-react";

export const ConsentPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const parsedProgramId = programId ? parseInt(programId) : 0;
  
  const { data: programs } = usePrograms();
  const { data: consentForm, isLoading } = useProgramConsent(parsedProgramId);
  
  const program = programs?.find(p => p.id === parsedProgramId);

  if (!programId || isNaN(parsedProgramId)) {
    return <Navigate to="/programs" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  if (!consentForm) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">동의서를 찾을 수 없습니다</h1>
            <p className="text-muted-foreground">해당 프로그램의 동의서가 생성되지 않았거나 비활성 상태입니다.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <ConsentFormComponent 
          consentForm={consentForm} 
          programTitle={program?.title || "프로그램"} 
        />
      </main>
    </div>
  );
};