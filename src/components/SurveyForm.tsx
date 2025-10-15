import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Survey, useSubmitSurveyResponse, useUserSurveyResponse } from "@/hooks/useSurveys";
import { FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface SurveyFormProps {
  survey: Survey;
  programTitle: string;
}

export const SurveyForm = ({ survey, programTitle }: SurveyFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();
  const submitResponse = useSubmitSurveyResponse();
  const { data: existingResponse } = useUserSurveyResponse(survey.id);

  const watchedValues = watch();

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await submitResponse.mutateAsync({
        surveyId: survey.id,
        responses: data,
      });
      toast.success("설문 응답이 성공적으로 제출되었습니다.");
      navigate(-1); // 이전 페이지로 이동
    } finally {
      setIsSubmitting(false);
    }
  };

  if (existingResponse) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold mb-2">설문 응답 완료</h2>
            <p className="text-muted-foreground mb-4">
              이미 이 설문에 응답하셨습니다. 소중한 의견 감사합니다.
            </p>
            <Button onClick={() => navigate(-1)}>
              이전으로 돌아가기
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {survey.title.replace(/00 0000/g, programTitle)}
        </CardTitle>
        {survey.description && (
          <p className="text-muted-foreground">
            {survey.description.replace(/00 0000/g, programTitle)}
          </p>
        )}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="institution">소속 기관 또는 학교</Label>
              <Input
                id="institution"
                {...register("institution", { required: "소속 기관을 입력해주세요." })}
                placeholder="예: 서울대학교, ABC회사"
              />
              {errors.institution && (
                <p className="text-sm text-destructive">{errors.institution.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">나이</Label>
              <Input
                id="age"
                type="number"
                {...register("age", { required: "나이를 입력해주세요.", min: 1, max: 100 })}
                placeholder="예: 25"
              />
              {errors.age && (
                <p className="text-sm text-destructive">{errors.age.message as string}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>성별</Label>
            <RadioGroup
              value={watchedValues.gender}
              onValueChange={(value) => setValue("gender", value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male">남</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female">여</Label>
              </div>
            </RadioGroup>
            {errors.gender && (
              <p className="text-sm text-destructive">{errors.gender.message as string}</p>
            )}
          </div>

          {/* 만족도 문항 */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">만족도 평가</h3>
            
            {[
              "교육과정 운영 전반에 대한 만족도",
              "교육시간의 적절성",
              "교육 수강 인원의 적절성",
              "교육 프로그램 구성 만족도",
              "강사의 준비성, 전문성",
              "프로그램 흥미/유익성",
              `앞으로 ${programTitle} 수업이 있으면 계속 참여하거나 다른 사람에게 추천하시겠습니까?`
            ].map((question, index) => (
              <div key={index} className="space-y-3">
                <Label className="text-sm font-medium">
                  {index + 1}. {question}
                </Label>
                <RadioGroup
                  value={watchedValues[`satisfaction_${index}`]}
                  onValueChange={(value) => setValue(`satisfaction_${index}`, value)}
                >
                  {[
                    { value: "5", label: "매우 만족" },
                    { value: "4", label: "만족" },
                    { value: "3", label: "보통" },
                    { value: "2", label: "불만" },
                    { value: "1", label: "매우 불만" }
                  ].map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`satisfaction_${index}_${option.value}`} />
                      <Label htmlFor={`satisfaction_${index}_${option.value}`}>{option.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </div>

          {/* 자유 응답 */}
          <div className="space-y-2">
            <Label htmlFor="comments">기타 의견</Label>
            <Textarea
              id="comments"
              {...register("comments")}
              placeholder="교육과정에 대한 건의사항이나 개선점이 있으시면 자유롭게 작성해주세요."
              rows={4}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "제출 중..." : "설문 응답 제출"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};