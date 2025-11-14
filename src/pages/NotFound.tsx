import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "페이지를 찾을 수 없습니다 - 인천 Connect Hub";
  }, []);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-xl text-muted-foreground mb-4">페이지를 찾을 수 없습니다</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            홈으로 돌아가기
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
