import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignatureModal } from "@/components/SignatureModal";
import { useSubmitConsent, type ConsentFormType, type ConsentInput } from "@/hooks/useConsent";
import { cn } from "@/lib/utils";

const consentSchema = z.object({
  name: z.string().min(1, "성명을 입력해주세요"),
  birth_date: z.date({ required_error: "생년월일을 선택해주세요" }),
  gender: z.enum(["male", "female"], { required_error: "성별을 선택해주세요" }),
  phone: z.string().min(1, "휴대폰 번호를 입력해주세요"),
  address: z.string().min(1, "거주동명을 입력해주세요"),
  institution: z.string().min(1, "학교 또는 기관을 입력해주세요"),
  agreed: z.boolean().refine(val => val === true || val === false, "동의 여부를 선택해주세요"),
});

type ConsentFormData = z.infer<typeof consentSchema>;

interface ConsentFormComponentProps {
  consentForm: ConsentFormType;
  programTitle: string;
}

export const ConsentFormComponent = ({ consentForm, programTitle }: ConsentFormComponentProps) => {
  const navigate = useNavigate();
  const submitMutation = useSubmitConsent();
  const [signature, setSignature] = useState<string>("");
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear() - 30);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

  const form = useForm<ConsentFormData>({
    resolver: zodResolver(consentSchema),
    defaultValues: {
      agreed: undefined as any,
    },
  });

  // 년도 목록 생성 (1924-2024)
  const years = Array.from({ length: 101 }, (_, i) => 2024 - i);
  const months = [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월"
  ];

  const onSubmit = async (data: ConsentFormData) => {
    if (!signature) {
      alert("서명을 입력해주세요.");
      return;
    }

    if (data.agreed === undefined) {
      alert("개인정보 수집 및 활용 동의 여부를 선택해주세요.");
      return;
    }

    setIsSubmitting(true);

    const consentInput: ConsentInput = {
      name: data.name,
      birth_date: format(data.birth_date, "yyyy-MM-dd"),
      gender: data.gender,
      phone: data.phone,
      address: data.address,
      institution: data.institution,
      agreed: data.agreed,
      signature,
    };

    try {
      await submitMutation.mutateAsync({
        consentFormId: consentForm.id,
        consentData: consentInput,
      });
      
      navigate(-1);
    } catch (error) {
      console.error("동의서 제출 실패:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignatureConfirm = (imageUrl: string) => {
    setSignature(imageUrl);
    setIsSignatureModalOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            개인정보 수집 및 활용 동의서
          </CardTitle>
          <div className="text-center space-y-2">
            <p className="text-lg">
              <strong>프로그램명:</strong> {programTitle}
            </p>
            <p className="text-lg">
              <strong>날짜:</strong> {format(new Date(), "yyyy년 MM월 dd일", { locale: ko })}
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 개인정보 입력 필드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">성명 *</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="성명을 입력해주세요"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label>생년월일 *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.watch("birth_date") && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch("birth_date") 
                        ? format(form.watch("birth_date"), "yyyy년 MM월 dd일", { locale: ko })
                        : "생년월일을 선택해주세요"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-3 border-b">
                      <div className="flex items-center justify-between mb-2">
                        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="년도" />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map(year => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}년
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                          <SelectTrigger className="w-[80px]">
                            <SelectValue placeholder="월" />
                          </SelectTrigger>
                          <SelectContent>
                            {months.map((month, index) => (
                              <SelectItem key={index} value={index.toString()}>
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Calendar
                      mode="single"
                      selected={form.watch("birth_date")}
                      onSelect={(date) => form.setValue("birth_date", date!)}
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                      month={new Date(selectedYear, selectedMonth)}
                      onMonthChange={(date) => {
                        setSelectedYear(date.getFullYear());
                        setSelectedMonth(date.getMonth());
                      }}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                {form.formState.errors.birth_date && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.birth_date.message}
                  </p>
                )}
              </div>

              <div>
                <Label>성별 *</Label>
                <RadioGroup
                  value={form.watch("gender")}
                  onValueChange={(value) => form.setValue("gender", value as "male" | "female")}
                  className="flex gap-4 mt-2"
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
                {form.formState.errors.gender && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.gender.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">휴대폰 번호 *</Label>
                <Input
                  id="phone"
                  {...form.register("phone")}
                  placeholder="010-1234-5678"
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="address">거주동명 *</Label>
                <Input
                  id="address"
                  {...form.register("address")}
                  placeholder="거주동명을 입력해주세요"
                />
                {form.formState.errors.address && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.address.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="institution">학교 또는 기관 *</Label>
                <Input
                  id="institution"
                  {...form.register("institution")}
                  placeholder="학교 또는 기관을 입력해주세요"
                />
                {form.formState.errors.institution && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.institution.message}
                  </p>
                )}
              </div>
            </div>

            {/* 개인정보 수집 및 활용 안내 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold mb-2">개인정보 수집 및 활용 안내</h3>
              <div className="text-sm space-y-1 whitespace-pre-wrap">
                {consentForm.content || (
                  <>
                    <p><strong>수집 목적:</strong> 프로그램 참여자 관리 및 서비스 제공</p>
                    <p><strong>수집 항목:</strong> 성명, 생년월일, 성별, 휴대폰 번호, 거주동명, 학교/기관</p>
                    <p><strong>보유 기간:</strong> 프로그램 종료 후 1년</p>
                    <p><strong>동의 거부권:</strong> 개인정보 수집에 동의하지 않을 권리가 있으며, 동의 거부 시 프로그램 참여가 제한될 수 있습니다.</p>
                  </>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agree"
                    checked={form.watch("agreed") === true}
                    onCheckedChange={(checked) => form.setValue("agreed", checked as boolean)}
                  />
                  <Label htmlFor="agree">개인정보 수집 및 활용에 동의합니다.</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="disagree"
                    checked={form.watch("agreed") === false}
                    onCheckedChange={(checked) => form.setValue("agreed", !checked as boolean)}
                  />
                  <Label htmlFor="disagree">개인정보 수집 및 활용에 동의하지 않습니다.</Label>
                </div>
              </div>
              {form.formState.errors.agreed && (
                <p className="text-sm text-destructive mt-1">
                  동의 여부를 선택해주세요.
                </p>
              )}
            </div>

            {/* 서명 */}
            <div>
              <Label>서명 *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {signature ? (
                  <div className="space-y-2">
                    <img src={signature} alt="서명" className="mx-auto max-h-32 border" />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsSignatureModalOpen(true)}
                    >
                      서명 다시 하기
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsSignatureModalOpen(true)}
                  >
                    서명하기
                  </Button>
                )}
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="flex justify-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                취소
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !signature || form.watch("agreed") === undefined}
              >
                {isSubmitting ? "제출 중..." : "제출하기"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onConfirm={handleSignatureConfirm}
        studentName={form.watch("name") || "참여자"}
        signatureType="student"
      />
    </div>
  );
};