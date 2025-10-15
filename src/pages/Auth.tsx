import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { validatePassword, getPasswordStrengthText, type PasswordValidationResult } from "@/lib/passwordValidation";
import { AlertTriangle, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import Footer from "@/components/Footer";

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "로그인 - 인천 Connect Hub";
  }, []);

  // 비밀번호 실시간 검증 (회원가입 모드에서만)
  useEffect(() => {
    if (mode === "signup" && password) {
      setIsValidating(true);
      const debounceTimer = setTimeout(async () => {
        const result = await validatePassword(password);
        setPasswordValidation(result);
        setIsValidating(false);
      }, 500);
      
      return () => clearTimeout(debounceTimer);
    } else {
      setPasswordValidation(null);
    }
  }, [password, mode]);

  if (user) {
    // 로그인된 사용자가 온보딩을 완료했는지 확인
    const checkOnboardingStatus = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();

        if (profile && !profile.onboarding_completed) {
          navigate("/onboarding");
          return;
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    checkOnboardingStatus();
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("로그인 되었습니다");
        navigate("/admin/programs");
      }
    } else {
      // 회원가입 시 비밀번호 검증
      if (!passwordValidation?.isValid) {
        toast.error("비밀번호 요구사항을 만족하지 않습니다.");
        return;
      }
      
      const { error } = await signUp(email, password, { name, nickname });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("회원가입 링크가 이메일로 전송되었습니다. 이메일 확인 후 온보딩을 완료해주세요.");
        // 회원가입 성공 후 온보딩 페이지로 리디렉션될 수 있도록 준비
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{mode === "login" ? "로그인" : "회원가입"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                {mode === "signup" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">이름</Label>
                      <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nickname">닉네임</Label>
                      <Input id="nickname" type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} required />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호</Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  {/* 회원가입 모드에서 비밀번호 강도 표시 */}
                  {mode === "signup" && password && (
                    <div className="space-y-3 mt-3">
                      {/* 강도 게이지 */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>비밀번호 강도</span>
                          {passwordValidation && (
                            <span className={getPasswordStrengthText(passwordValidation.score).color}>
                              {getPasswordStrengthText(passwordValidation.score).text}
                            </span>
                          )}
                        </div>
                        <Progress 
                          value={passwordValidation ? (passwordValidation.score + 1) * 20 : 0} 
                          className="h-2"
                        />
                      </div>
                      
                      {/* 검증 결과 */}
                      {isValidating ? (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>비밀번호를 검증하는 중...</AlertDescription>
                        </Alert>
                      ) : passwordValidation && (
                        <div className="space-y-2">
                          {passwordValidation.isValid ? (
                            <Alert className="border-green-200 bg-green-50">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <AlertDescription className="text-green-800">
                                안전한 비밀번호입니다!
                              </AlertDescription>
                            </Alert>
                          ) : (
                            <Alert className="border-red-200 bg-red-50">
                              <XCircle className="h-4 w-4 text-red-600" />
                              <AlertDescription className="text-red-800">
                                <div className="space-y-1">
                                  {passwordValidation.feedback.map((feedback, index) => (
                                    <div key={index}>• {feedback}</div>
                                  ))}
                                </div>
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || (mode === "signup" && (!passwordValidation?.isValid || isValidating))}
                >
                  {loading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
                </Button>
              </form>
              <div className="mt-4 text-sm text-muted-foreground">
                {mode === "login" ? (
                  <span>
                    계정이 없으신가요? {" "}
                    <button className="text-primary" onClick={() => setMode("signup")}>회원가입</button>
                  </span>
                ) : (
                  <span>
                    이미 계정이 있으신가요? {" "}
                    <button className="text-primary" onClick={() => setMode("login")}>로그인</button>
                  </span>
                )}
              </div>
              <div className="mt-6 text-center">
                <Link to="/" className="text-sm text-primary">
                  홈으로 돌아가기
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Auth;