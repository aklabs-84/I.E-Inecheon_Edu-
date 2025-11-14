import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface OnboardingData {
  age_group: string;
  gender: string;
  region: string;
  preferred_category: string;
  learning_style: string;
  available_time: string[];
  learning_purpose: string;
}

const STEPS = [
  { id: 'age', title: '나이대를 선택해주세요', key: 'age_group' as keyof OnboardingData },
  { id: 'gender', title: '성별을 선택해주세요', key: 'gender' as keyof OnboardingData },
  { id: 'region', title: '거주 지역을 선택해주세요', key: 'region' as keyof OnboardingData },
  { id: 'category', title: '관심 카테고리를 선택해주세요', key: 'preferred_category' as keyof OnboardingData },
  { id: 'learning', title: '선호하는 학습 방식을 선택해주세요', key: 'learning_style' as keyof OnboardingData },
  { id: 'time', title: '참여 가능한 시간대를 선택해주세요', key: 'available_time' as keyof OnboardingData },
  { id: 'purpose', title: '학습 목적을 선택해주세요', key: 'learning_purpose' as keyof OnboardingData }
];

const Onboarding = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    age_group: '',
    gender: '',
    region: '',
    preferred_category: '',
    learning_style: '',
    available_time: [],
    learning_purpose: ''
  });

  useEffect(() => {
    document.title = "온보딩 - 인천 Connect Hub";
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...data,
          available_time: data.available_time.join(','), // 배열을 문자열로 변환
          onboarding_completed: true
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("온보딩이 완료되었습니다!");
      navigate('/recommendation-result');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error("온보딩 완료 중 오류가 발생했습니다.");
    }
  };

  const updateData = (key: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const isStepComplete = () => {
    const currentStepData = data[STEPS[currentStep].key];
    return Array.isArray(currentStepData) ? currentStepData.length > 0 : Boolean(currentStepData);
  };

  const renderStep = () => {
    const step = STEPS[currentStep];
    
    switch (step.id) {
      case 'age':
        return (
          <RadioGroup value={data.age_group} onValueChange={(value) => updateData('age_group', value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="10대" id="teens" />
              <Label htmlFor="teens">10대</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="20대" id="twenties" />
              <Label htmlFor="twenties">20대</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="30대" id="thirties" />
              <Label htmlFor="thirties">30대</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="40대" id="forties" />
              <Label htmlFor="forties">40대</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="50대" id="fifties" />
              <Label htmlFor="fifties">50대</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="60대 이상" id="sixties" />
              <Label htmlFor="sixties">60대 이상</Label>
            </div>
          </RadioGroup>
        );

      case 'gender':
        return (
          <RadioGroup value={data.gender} onValueChange={(value) => updateData('gender', value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="남성" id="male" />
              <Label htmlFor="male">남성</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="여성" id="female" />
              <Label htmlFor="female">여성</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="기타" id="other" />
              <Label htmlFor="other">기타</Label>
            </div>
          </RadioGroup>
        );

      case 'region':
        return (
          <Select value={data.region} onValueChange={(value) => updateData('region', value)}>
            <SelectTrigger>
              <SelectValue placeholder="거주 지역을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="중구">중구</SelectItem>
              <SelectItem value="동구">동구</SelectItem>
              <SelectItem value="미추홀구">미추홀구</SelectItem>
              <SelectItem value="연수구">연수구</SelectItem>
              <SelectItem value="남동구">남동구</SelectItem>
              <SelectItem value="부평구">부평구</SelectItem>
              <SelectItem value="계양구">계양구</SelectItem>
              <SelectItem value="서구">서구</SelectItem>
              <SelectItem value="강화군">강화군</SelectItem>
              <SelectItem value="옹진군">옹진군</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'category':
        return (
          <RadioGroup value={data.preferred_category} onValueChange={(value) => updateData('preferred_category', value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="컴퓨터" id="computer" />
              <Label htmlFor="computer">컴퓨터</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="어학" id="language" />
              <Label htmlFor="language">어학</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="예술" id="art" />
              <Label htmlFor="art">예술</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="요리" id="cooking" />
              <Label htmlFor="cooking">요리</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="운동" id="exercise" />
              <Label htmlFor="exercise">운동</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="기타" id="other-category" />
              <Label htmlFor="other-category">기타</Label>
            </div>
          </RadioGroup>
        );

      case 'learning':
        return (
          <RadioGroup value={data.learning_style} onValueChange={(value) => updateData('learning_style', value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="오프라인" id="offline" />
              <Label htmlFor="offline">오프라인</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="온라인" id="online" />
              <Label htmlFor="online">온라인</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="상관없음" id="both" />
              <Label htmlFor="both">상관없음</Label>
            </div>
          </RadioGroup>
        );

      case 'time':
        const times = ['오전', '오후', '저녁', '주말'];
        return (
          <div className="space-y-3">
            {times.map((time) => (
              <div key={time} className="flex items-center space-x-2">
                <Checkbox
                  id={time}
                  checked={data.available_time.includes(time)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateData('available_time', [...data.available_time, time]);
                    } else {
                      updateData('available_time', data.available_time.filter(t => t !== time));
                    }
                  }}
                />
                <Label htmlFor={time}>{time}</Label>
              </div>
            ))}
          </div>
        );

      case 'purpose':
        return (
          <RadioGroup value={data.learning_purpose} onValueChange={(value) => updateData('learning_purpose', value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="자격증" id="certificate" />
              <Label htmlFor="certificate">자격증</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="취미" id="hobby" />
              <Label htmlFor="hobby">취미</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="진학" id="education" />
              <Label htmlFor="education">진학</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="취업" id="job" />
              <Label htmlFor="job">취업</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="개인발전" id="development" />
              <Label htmlFor="development">개인발전</Label>
            </div>
          </RadioGroup>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Progress value={(currentStep + 1) / STEPS.length * 100} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {currentStep + 1} / {STEPS.length}
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>{STEPS[currentStep].title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderStep()}
              
              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  이전
                </Button>
                
                {currentStep === STEPS.length - 1 ? (
                  <Button
                    onClick={handleComplete}
                    disabled={!isStepComplete()}
                  >
                    완료
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={!isStepComplete()}
                  >
                    다음
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Onboarding;