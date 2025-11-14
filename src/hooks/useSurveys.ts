import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Survey {
  id: number;
  program_id: number;
  title: string;
  description?: string;
  questions: any;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SurveyResponse {
  id: number;
  survey_id: number;
  user_id: string;
  responses: Record<string, any>;
  created_at: string;
  profiles?: {
    name?: string;
    nickname?: string;
    region?: string;
  };
}

export const useProgramSurveys = (programId: number) => {
  return useQuery({
    queryKey: ["program-surveys", programId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surveys")
        .select("*")
        .eq("program_id", programId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any;
    },
  });
};

export const useSurvey = (surveyId: number) => {
  return useQuery({
    queryKey: ["survey", surveyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surveys")
        .select("*")
        .eq("id", surveyId)
        .single();

      if (error) throw error;
      return data as any;
    },
  });
};

export const useCreateSurvey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (survey: any) => {
      const surveyData = { ...survey, created_by: (await supabase.auth.getUser()).data.user?.id };
      const { data, error } = await supabase
        .from("surveys")
        .insert(surveyData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["program-surveys", variables.program_id] });
      toast.success("설문지가 생성되었습니다.");
    },
    onError: () => toast.error("설문지 생성 중 오류가 발생했습니다."),
  });
};

export const useUpdateSurvey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...survey }: any) => {
      const { data, error } = await supabase
        .from("surveys")
        .update(survey)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["survey", data.id] });
      queryClient.invalidateQueries({ queryKey: ["program-surveys", data.program_id] });
      toast.success("설문지가 업데이트되었습니다.");
    },
    onError: () => toast.error("설문지 업데이트 중 오류가 발생했습니다."),
  });
};

export const useSubmitSurveyResponse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ surveyId, responses }: { surveyId: number; responses: Record<string, any>; }) => {
      const user = (await supabase.auth.getUser()).data.user;
      const { data, error } = await supabase
        .from("survey_responses")
        .insert({
          survey_id: surveyId,
          user_id: user?.id,
          responses,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate both the per-survey responses and the aggregated satisfaction
      queryClient.invalidateQueries({ queryKey: ["survey-responses", variables.surveyId] });
      queryClient.invalidateQueries({ queryKey: ["satisfaction"] });
      toast.success("설문 응답이 제출되었습니다.");
    },
    onError: () => toast.error("설문 응답 제출 중 오류가 발생했습니다."),
  });
};

export const useSurveyResponses = (surveyId: number) => {
  return useQuery({
    queryKey: ["survey-responses", surveyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_survey_responses_with_profiles", {
          survey_id_param: surveyId
        });
      if (error) throw error;
      
      // Transform the data to match the expected SurveyResponse interface
      return (data || []).map((row: any) => ({
        id: row.id,
        survey_id: row.survey_id,
        user_id: row.user_id,
        responses: row.responses,
        created_at: row.created_at,
        profiles: {
          name: row.name,
          nickname: row.nickname,
          region: row.region
        }
      })) as SurveyResponse[];
    },
  });
};

export const useUserSurveyResponse = (surveyId: number) => {
  return useQuery({
    queryKey: ["user-survey-response", surveyId, "user"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;
      
      const { data, error } = await supabase
        .from("survey_responses")
        .select("*")
        .eq("survey_id", surveyId)
        .eq("user_id", user.user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: surveyId > 0, // Only fetch when surveyId is valid
  });
};