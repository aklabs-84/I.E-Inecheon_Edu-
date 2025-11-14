import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Application {
  id: number;
  user_id: string;
  program_id: number;
  status: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface ApplicationWithProgram extends Application {
  programs: {
    id: number;
    title: string;
    category: string | null;
    region: string | null;
    start_at: string | null;
    end_at: string | null;
    capacity: number | null;
    description: string | null;
    image_url: string | null;
  };
}

// 사용자의 신청 내역 조회 (프로그램 정보 포함)
export const useMyApplications = () => {
  return useQuery({
    queryKey: ["my-applications"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }

      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          programs (
            id,
            title,
            category,
            region,
            start_at,
            end_at,
            capacity,
            description,
            image_url
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching my applications:", error);
        throw error;
      }

      return data as ApplicationWithProgram[];
    },
  });
};

// 프로그램별 신청자 수 조회
export const useProgramApplications = (programIds: number[]) => {
  return useQuery({
    queryKey: ["program-applications", programIds],
    queryFn: async () => {
      if (programIds.length === 0) return {};

      const { data, error } = await supabase
        .from("applications")
        .select("program_id")
        .in("program_id", programIds);

      if (error) {
        console.error("Error fetching applications:", error);
        throw error;
      }

      // 프로그램별 신청자 수 계산
      const applicationCounts: Record<number, number> = {};
      data.forEach((app) => {
        applicationCounts[app.program_id] = (applicationCounts[app.program_id] || 0) + 1;
      });

      return applicationCounts;
    },
    enabled: programIds.length > 0,
  });
};

// 특정 프로그램의 신청자 목록 조회 (관리자용)
export const useProgramApplicationsDetail = (programId: number) => {
  return useQuery({
    queryKey: ["program-applications-detail", programId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          *,
          profiles (
            id,
            name,
            email,
            nickname,
            age_group,
            gender,
            region
          )
        `)
        .eq("program_id", programId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching program applications:", error);
        throw error;
      }

      return data;
    },
    enabled: !!programId,
  });
};

// 신청 상태 업데이트 (관리자용)
export const useUpdateApplicationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: number; status: 'pending' | 'approved' | 'cancelled' }) => {
      const { error } = await supabase
        .from("applications")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", applicationId);

      if (error) {
        console.error("Error updating application status:", error);
        throw error;
      }

      return { applicationId, status };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["program-applications-detail"] });
      queryClient.invalidateQueries({ queryKey: ["program-applications"] });
      const statusText =
        data.status === 'approved' ? '승인' : data.status === 'cancelled' ? '거절' : '대기중으로 변경';
      toast.success(`신청이 ${statusText}되었습니다.`);
    },
    onError: (error) => {
      console.error("Update application status error:", error);
      toast.error("상태 업데이트에 실패했습니다.");
    },
  });
};

// 신청 취소 (사용자용)
export const useCancelApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicationId: number) => {
      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("id", applicationId);

      if (error) {
        console.error("Error canceling application:", error);
        throw error;
      }

      return applicationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
      toast.success("신청이 취소되었습니다.");
    },
    onError: (error) => {
      console.error("Cancel application error:", error);
      toast.error("신청 취소에 실패했습니다.");
    },
  });
};

// 신청 삭제 (관리자용)
export const useDeleteApplicationAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicationId: number) => {
      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("id", applicationId);

      if (error) {
        console.error("Error deleting application (admin):", error);
        throw error;
      }

      return applicationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-applications-detail"] });
      queryClient.invalidateQueries({ queryKey: ["program-applications"] });
      toast.success("신청이 삭제되었습니다.");
    },
    onError: (error) => {
      console.error("Delete application error (admin):", error);
      toast.error("신청 삭제에 실패했습니다.");
    },
  });
};