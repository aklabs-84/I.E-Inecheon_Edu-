import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { sendBlacklistNotificationEmail, sendBlacklistRemovalEmail } from "@/utils/blacklistEmailService";

export interface BlacklistRecord {
  id: number;
  user_id: string;
  program_id: number | null;
  reason: string;
  blacklisted_at: string;
  blacklisted_until: string;
  blacklisted_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // 조인된 데이터를 위한 추가 타입
  profiles?: {
    name: string;
    email: string;
    nickname?: string;
  };
  programs?: {
    title: string;
  };
  blacklisted_by_profile?: {
    name: string;
  };
}

// 사용자의 활성 블랙리스트 확인
export const useCheckBlacklist = (userId?: string) => {
  return useQuery<BlacklistRecord | null>({
    queryKey: ["check-blacklist", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await (supabase as any)
        .from("blacklist")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .gte("blacklisted_until", new Date().toISOString())
        .order("blacklisted_until", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking blacklist:", error);
        throw error;
      }

      return data as unknown as BlacklistRecord | null;
    },
    enabled: !!userId,
  });
};

// 현재 사용자의 블랙리스트 상태 확인
export const useMyBlacklistStatus = () => {
  const { user } = useAuth();
  return useCheckBlacklist(user?.id);
};

// 블랙리스트 처리
export const useAddToBlacklist = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      userId,
      programId,
      reason = "연속 결석",
    }: {
      userId: string;
      programId?: number;
      reason?: string;
    }) => {
      // 6개월 후 날짜 계산 (기존 3개월에서 연장)
      const blacklistedUntil = new Date();
      blacklistedUntil.setMonth(blacklistedUntil.getMonth() + 6);

      const { data, error } = await (supabase as any)
        .from("blacklist")
        .insert({
          user_id: userId,
          program_id: programId,
          reason,
          blacklisted_until: blacklistedUntil.toISOString(),
          blacklisted_by: user?.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding to blacklist:", error);
        throw error;
      }

      return data;
    },
    onSuccess: async (data) => {
      // 모든 관련 쿼리 캐시 무효화
      await queryClient.invalidateQueries({ queryKey: ["check-blacklist"] });
      await queryClient.invalidateQueries({ queryKey: ["blacklist-records"] });
      
      // 강제로 블랙리스트 데이터 다시 가져오기
      await queryClient.refetchQueries({ queryKey: ["blacklist-records"] });
      
      toast.success("블랙리스트에 추가되었습니다.");
      
      // 사용자 정보 조회 후 이메일 발송
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from("profiles")
          .select("email, name")
          .eq("id", (data as any).user_id)
          .single();

        if (!profileError && userProfile?.email) {
          const { data: programData } = await supabase
            .from("programs")
            .select("title")
            .eq("id", (data as any).program_id!)
            .single();

          await sendBlacklistNotificationEmail({
            userEmail: userProfile.email,
            userName: userProfile.name || "참여자",
            programTitle: programData?.title,
            reason: (data as any).reason,
            blacklistedUntil: (data as any).blacklisted_until,
          });

          // 추가 알림 (브라우저 알림으로 이메일 발송 시뮬레이션)
          toast.success(`${userProfile.name}님에게 블랙리스트 처리 알림이 발송되었습니다.`, {
            duration: 5000,
            description: `이메일: ${userProfile.email}`,
          });
        }
      } catch (emailError) {
        console.error("이메일 발송 실패:", emailError);
        toast.warning("블랙리스트 처리는 완료되었으나 이메일 발송에 실패했습니다.");
      }
    },
    onError: (error) => {
      console.error("Blacklist error:", error);
      toast.error("블랙리스트 처리에 실패했습니다.");
    },
  });
};

// 블랙리스트 해제
export const useRemoveFromBlacklist = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (blacklistId: number) => {
      const { data, error } = await (supabase as any)
        .from("blacklist")
        .update({ is_active: false })
        .eq("id", blacklistId)
        .select()
        .single();

      if (error) {
        console.error("Error removing from blacklist:", error);
        throw error;
      }

      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["check-blacklist"] });
      queryClient.invalidateQueries({ queryKey: ["blacklist-records"] });
      
      toast.success("블랙리스트에서 해제되었습니다.");

      // 사용자 정보 조회 후 해제 알림 이메일 발송
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from("profiles")
          .select("email, name")
          .eq("id", (data as any).user_id)
          .single();

        const { data: adminProfile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", user?.id!)
          .single();

        if (!profileError && userProfile?.email) {
          await sendBlacklistRemovalEmail({
            userEmail: userProfile.email,
            userName: userProfile.name || "참여자",
            removedBy: adminProfile?.name || "관리자",
          });

          toast.success("블랙리스트 해제 알림 이메일이 발송되었습니다.");
        }
      } catch (emailError) {
        console.error("이메일 발송 실패:", emailError);
        toast.warning("블랙리스트 해제는 완료되었으나 이메일 발송에 실패했습니다.");
      }
    },
    onError: (error) => {
      console.error("Remove blacklist error:", error);
      toast.error("블랙리스트 해제에 실패했습니다.");
    },
  });
};

// 모든 블랙리스트 기록 조회 (관리자용)
export const useBlacklistRecords = () => {
  return useQuery<BlacklistRecord[]>({
    queryKey: ["blacklist-records"],
    queryFn: async () => {
      const { data: simpleData, error: simpleError } = await (supabase as any)
        .from("blacklist")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (simpleError) {
        console.error("Error fetching blacklist records:", simpleError);
        return [];
      }
      
      return simpleData as unknown as BlacklistRecord[];
    },
    refetchInterval: 5000, // 5초마다 자동 새로고침
    refetchIntervalInBackground: true, // 백그라운드에서도 새로고침
  });
};