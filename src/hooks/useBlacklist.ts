import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { sendBlacklistEmail, sendBlacklistRemovalEmail } from "@/utils/blacklistEmailService";
import { BlacklistNotifications } from "@/utils/notifications";

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

// 사용자의 만료된 블랙리스트 레코드 정리
export const useCleanupExpiredBlacklist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId?: string) => {
      const now = new Date().toISOString();
      
      // 특정 사용자 또는 모든 만료된 레코드 삭제
      const query = (supabase as any)
        .from("blacklist")
        .delete()
        .lt("blacklisted_until", now);

      if (userId) {
        query.eq("user_id", userId);
      }

      const { error } = await query;

      if (error) {
        console.error("Error cleaning up expired blacklist:", error);
        throw error;
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["check-blacklist"] });
      queryClient.invalidateQueries({ queryKey: ["blacklist-records"] });
    },
  });
};

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
      // 1. 먼저 해당 사용자의 기존 비활성 블랙리스트 레코드들을 모두 삭제
      await (supabase as any)
        .from("blacklist")
        .delete()
        .eq("user_id", userId)
        .eq("is_active", false);

      // 2. 해당 사용자의 활성 블랙리스트가 있는지 확인
      const { data: existingActive } = await (supabase as any)
        .from("blacklist")
        .select("id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .single();

      if (existingActive) {
        throw new Error("이미 활성 블랙리스트에 등록된 사용자입니다.");
      }

      // 3. 새로운 블랙리스트 기록 생성 (6개월 후)
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
          const emailResult = await sendBlacklistEmail(
            userProfile.email,
            userProfile.name || "참여자",
            (data as any).reason,
            (data as any).blacklisted_until
          );

          // 향상된 알림 시스템 사용
          BlacklistNotifications.addSuccess(
            userProfile.name || "참여자", 
            (data as any).reason
          );

          if (emailResult.success) {
            BlacklistNotifications.emailSent(userProfile.email, 'blacklist');
          } else {
            BlacklistNotifications.emailFailed(emailResult.error || "알 수 없는 오류");
          }
        }
      } catch (emailError) {
        console.error("이메일 발송 실패:", emailError);
        BlacklistNotifications.emailFailed(emailError.message || "이메일 발송 중 오류 발생");
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
      // 블랙리스트 해제 시 완전 삭제
      const { data, error } = await (supabase as any)
        .from("blacklist")
        .delete()
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

        if (!profileError && userProfile?.email) {
          const emailResult = await sendBlacklistRemovalEmail(
            userProfile.email,
            userProfile.name || "참여자"
          );

          // 향상된 알림 시스템 사용
          BlacklistNotifications.removeSuccess(userProfile.name || "참여자");

          if (emailResult.success) {
            BlacklistNotifications.emailSent(userProfile.email, 'removal');
          } else {
            BlacklistNotifications.emailFailed(emailResult.error || "알 수 없는 오류");
          }
        }
      } catch (emailError) {
        console.error("이메일 발송 실패:", emailError);
        BlacklistNotifications.emailFailed(emailError.message || "이메일 발송 중 오류 발생");
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