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
  const [showPrivacyAgreement, setShowPrivacyAgreement] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
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
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>{mode === "login" ? "로그인" : showPrivacyAgreement ? "개인정보 수집 및 이용 동의" : "회원가입"}</CardTitle>
            </CardHeader>
            <CardContent>
              {mode === "signup" && !showPrivacyAgreement ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-center mb-4">📝 개인정보 수집 및 이용 동의서</h3>
                    
                    <div className="text-sm text-gray-700 space-y-3 leading-relaxed">
                      <p>
                        인천에듀는 「개인정보 보호법」 등 관련 법령에 따라 교육신청 및 회원관리 업무를 위하여 아래와 같이 개인정보를 수집·이용합니다. 내용을 자세히 읽으신 후 동의 여부를 선택해주시기 바랍니다.
                      </p>
                      
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">1. 수집하는 개인정보 항목</h4>
                        <p>필수항목: 이름, 이메일 주소</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">2. 개인정보 수집 및 이용 목적</h4>
                        <ul className="list-disc list-inside space-y-1">
                          <li>교육 신청 및 관리</li>
                          <li>교육 관련 안내, 공지사항 전달</li>
                          <li>본인 확인 및 신청 내역 확인</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">3. 처리 목적 외 이용 및 제3자 제공 없음</h4>
                        <p>인천에듀는 위 목적 외에 개인정보를 이용하거나 제3자에게 제공하지 않습니다.</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">4. 개인정보 보유 및 이용기간</h4>
                        <p>수집된 개인정보는 회원 탈퇴 또는 최종 이용일로부터 3년간 보관되며, 보관기간 경과 시 지체 없이 안전하게 파기합니다. 단, 관계법령에 의해 보존할 필요가 있는 경우 해당 법령에 따릅니다.</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">5. 동의 거부 권리 및 불이익 안내</h4>
                        <p>귀하는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다. 다만, 동의하지 않으실 경우 교육 신청이 제한될 수 있습니다.</p>
                      </div>
                      
                      <div className="mt-6 pt-4 border-t border-blue-200">
                        <p className="text-center text-gray-800 font-medium mb-4">
                          위 내용을 충분히 이해하였으며, 개인정보 수집 및 이용에 동의합니다.
                        </p>
                        
                        <div className="flex justify-center space-x-6">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="privacy_agreement"
                              value="agree"
                              checked={privacyAgreed === true}
                              onChange={() => setPrivacyAgreed(true)}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm">동의함</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="privacy_agreement"
                              value="disagree"
                              checked={privacyAgreed === false}
                              onChange={() => setPrivacyAgreed(false)}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-sm">동의하지 않음</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-4">
                    <Button 
                      type="button"
                      variant="outline"
                      className="flex-1" 
                      onClick={() => setMode("login")}
                    >
                      취소
                    </Button>
                    <Button 
                      type="button"
                      className="flex-1" 
                      disabled={!privacyAgreed}
                      onClick={() => {
                        if (privacyAgreed) {
                          setShowPrivacyAgreement(true);
                        }
                      }}
                    >
                      다음
                    </Button>
                  </div>
                </div>
              ) : (
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
                {mode === "login" ? (
                  <>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading}
                    >
                      {loading ? "처리 중..." : "로그인"}
                    </Button>
                    <Button 
                      type="button"
                      variant="outline"
                      className="w-full" 
                      onClick={() => setMode("signup")}
                    >
                      회원가입
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <Button 
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowPrivacyAgreement(false);
                          setPrivacyAgreed(false);
                        }}
                      >
                        ← 뒤로
                      </Button>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading || (!passwordValidation?.isValid || isValidating)}
                    >
                      {loading ? "처리 중..." : "회원가입"}
                    </Button>
                    <Button 
                      type="button"
                      variant="outline"
                      className="w-full" 
                      onClick={() => setMode("login")}
                    >
                      로그인으로 돌아가기
                    </Button>
                  </>
                )}
              </form>
              )}
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