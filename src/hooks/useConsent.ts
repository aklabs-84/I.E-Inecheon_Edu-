import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ConsentFormType {
  id: number;
  program_id: number;
  title: string;
  content: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ConsentSubmission {
  id: number;
  consent_form_id: number;
  user_id: string;
  agreed: boolean;
  signature?: string;
  created_at: string;
}

export interface ConsentSubmissionWithProfile extends ConsentSubmission {
  name?: string;
  birth_date?: string;
  gender?: string;
  phone?: string;
  address?: string;
  institution?: string;
  profiles?: {
    name: string;
    nickname: string;
    region: string;
  };
}

export interface ConsentCreateInput {
  programId: number;
  title: string;
  content: string;
  is_active?: boolean;
}

export interface ConsentUpdateInput {
  id: number;
  title?: string;
  content?: string;
  is_active?: boolean;
}

export interface ConsentInput {
  name: string;
  birth_date: string;
  gender: string;
  phone: string;
  address: string;
  institution: string;
  agreed: boolean;
  signature?: string;
}

// 프로그램의 활성 동의서 조회
export const useProgramConsent = (programId: number) => {
  return useQuery({
    queryKey: ["programConsent", programId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consent_forms")
        .select("*")
        .eq("program_id", programId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data as ConsentFormType | null;
    },
  });
};

// 동의서 생성
export const useCreateConsent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ programId, title, content, is_active = true }: ConsentCreateInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("사용자 인증이 필요합니다.");

      const { data, error } = await supabase
        .from("consent_forms")
        .insert({
          program_id: programId,
          title,
          content,
          is_active,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programConsent"] });
      toast.success("동의서가 생성되었습니다.");
    },
    onError: (error) => {
      console.error("동의서 생성 오류:", error);
      toast.error("동의서 생성에 실패했습니다.");
    },
  });
};

// 동의서 수정
export const useUpdateConsent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, title, content, is_active }: ConsentUpdateInput) => {
      const updates: any = {};
      
      if (title !== undefined) updates.title = title;
      if (content !== undefined) updates.content = content;
      if (is_active !== undefined) updates.is_active = is_active;
      
      const { data, error } = await supabase
        .from("consent_forms")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programConsent"] });
      toast.success("동의서가 수정되었습니다.");
    },
    onError: (error) => {
      console.error("동의서 수정 오류:", error);
      toast.error("동의서 수정에 실패했습니다.");
    },
  });
};

// 동의서 제출
export const useSubmitConsent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ consentFormId, consentData }: { consentFormId: number; consentData: ConsentInput }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("사용자 인증이 필요합니다.");

      // 동의서 제출 (프로필 업데이트 제거)
      const submissionData = {
        consent_form_id: consentFormId,
        user_id: user.id,
        agreed: consentData.agreed,
        signature: consentData.signature,
        name: consentData.name,
        birth_date: consentData.birth_date,
        gender: consentData.gender,
        phone: consentData.phone,
        address: consentData.address,
        institution: consentData.institution,
      };

      const { data, error } = await supabase
        .from("consent_submissions")
        .insert(submissionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consentSubmissions"] });
      queryClient.invalidateQueries({ queryKey: ["userConsentSubmission"] });
      toast.success("동의서가 제출되었습니다.");
    },
    onError: (error) => {
      console.error("동의서 제출 오류:", error);
      toast.error("동의서 제출에 실패했습니다.");
    },
  });
};

// 사용자의 동의서 제출 여부 확인
export const useUserConsentSubmission = (consentFormId: number) => {
  return useQuery({
    queryKey: ["userConsentSubmission", consentFormId],
    queryFn: async () => {
      if (consentFormId <= 0) return null;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("consent_submissions")
        .select("*")
        .eq("consent_form_id", consentFormId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as ConsentSubmission | null;
    },
    enabled: consentFormId > 0,
  });
};

// 동의서 제출 목록 조회 (관리자용)
export const useConsentSubmissions = (consentFormId: number) => {
  return useQuery({
    queryKey: ["consentSubmissions", consentFormId],
    queryFn: async () => {
      if (consentFormId <= 0) return [];

      const { data, error } = await supabase
        .from("consent_submissions")
        .select("*")
        .eq("consent_form_id", consentFormId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // 프로필 정보 별도 조회
      const submissions = data || [];
      const submissionsWithProfiles = await Promise.all(
        submissions.map(async (submission) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, nickname, region")
            .eq("id", submission.user_id)
            .maybeSingle();
            
          return {
            ...submission,
            profiles: profile
          };
        })
      );
      
      return submissionsWithProfiles as ConsentSubmissionWithProfile[];
    },
    enabled: consentFormId > 0,
  });
};