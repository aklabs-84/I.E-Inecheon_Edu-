import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Programs from "./pages/Programs";
import ProgramDetail from "./pages/ProgramDetail";
import Community from "./pages/Community";
import MyProfile from "./pages/MyProfile";
import Applications from "./pages/Applications";
import AdminPrograms from "./pages/AdminPrograms";
import ProgramManagement from "./pages/ProgramManagement";
import SuperAdmin from "./pages/SuperAdmin";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import RecommendationResult from "./pages/RecommendationResult";
import NotFound from "./pages/NotFound";
import Survey from "./pages/Survey";
import SurveyManagement from "./pages/SurveyManagement";
import { ConsentPage } from "./pages/ConsentPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/programs/:id" element={<ProgramDetail />} />
          <Route path="/community" element={<Community />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/my-applications" element={<Applications />} />
          <Route path="/admin/programs" element={<AdminPrograms />} />
          <Route path="/admin/programs/:id/manage" element={<ProgramManagement />} />
          <Route path="/admin/programs/:programId/survey-management" element={<SurveyManagement />} />
          <Route path="/survey/:surveyId" element={<Survey />} />
          <Route path="/consent/:programId" element={<ConsentPage />} />
          <Route path="/super-admin" element={<SuperAdmin />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/recommendation-result" element={<RecommendationResult />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
