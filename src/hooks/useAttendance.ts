import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AttendanceRecord {
  id: number;
  user_id: string;
  program_id: number;
  attendance_date: string;
  status: "present" | "absent" | "late";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceWithProfile extends AttendanceRecord {
  profiles: {
    id: string;
    name: string | null;
    email: string | null;
    nickname: string | null;
  };
}

// 특정 프로그램의 출석 기록 조회
export const useProgramAttendance = (programId: number, date?: string) => {
  return useQuery({
    queryKey: ["program-attendance", programId, date],
    queryFn: async () => {
      let attendanceQuery = supabase
        .from("attendance")
        .select("*")
        .eq("program_id", programId);

      if (date) {
        attendanceQuery = attendanceQuery.eq("attendance_date", date);
      }

      const { data: attendanceData, error: attendanceError } = await attendanceQuery.order("created_at", { ascending: false });

      if (attendanceError) {
        console.error("Error fetching attendance:", attendanceError);
        throw attendanceError;
      }

      if (!attendanceData || attendanceData.length === 0) {
        return [];
      }

      // Get profiles for the users
      const userIds = [...new Set(attendanceData.map(record => record.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, email, nickname")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }

      // Join attendance with profiles
      const attendanceWithProfiles = attendanceData.map(attendance => {
        const profile = profiles?.find(p => p.id === attendance.user_id);
        return {
          ...attendance,
          profiles: profile || { id: attendance.user_id, name: null, email: null, nickname: null }
        };
      });

      return attendanceWithProfiles as AttendanceWithProfile[];
    },
    enabled: !!programId,
  });
};

// 출석 기록 생성/업데이트
export const useMarkAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      programId,
      date,
      status,
      notes,
    }: {
      userId: string;
      programId: number;
      date: string;
      status: "present" | "absent" | "late";
      notes?: string;
    }) => {
      // 기존 출석 기록 확인
      const { data: existing } = await supabase
        .from("attendance")
        .select("id")
        .eq("user_id", userId)
        .eq("program_id", programId)
        .eq("attendance_date", date)
        .single();

      if (existing) {
        // 업데이트
        const { error } = await supabase
          .from("attendance")
          .update({ 
            status, 
            notes: notes || null,
            updated_at: new Date().toISOString() 
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // 신규 생성
        const { error } = await supabase
          .from("attendance")
          .insert({
            user_id: userId,
            program_id: programId,
            attendance_date: date,
            status,
            notes: notes || null,
          });

        if (error) throw error;
      }

      return { userId, programId, date, status };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["program-attendance", data.programId] });
      const statusText = data.status === "present" ? "출석" : data.status === "late" ? "지각" : "결석";
      toast.success(`${statusText} 처리되었습니다.`);
    },
    onError: (error) => {
      console.error("Mark attendance error:", error);
      toast.error("출석 처리에 실패했습니다.");
    },
  });
};

// 출석 통계 조회
export const useAttendanceStats = (programId: number) => {
  return useQuery({
    queryKey: ["attendance-stats", programId],
    queryFn: async () => {
      // 승인된 신청자 수
      const { data: approvedApplicants, error: applicantsError } = await supabase
        .from("applications")
        .select("id")
        .eq("program_id", programId)
        .eq("status", "approved");

      if (applicantsError) throw applicantsError;

      // 출석 통계
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance")
        .select("status, attendance_date")
        .eq("program_id", programId);

      if (attendanceError) throw attendanceError;

      const totalApplicants = approvedApplicants?.length || 0;
      
      // 날짜별 통계
      const dateStats: Record<string, { present: number; absent: number; late: number; total: number }> = {};
      
      attendanceData?.forEach((record) => {
        if (!dateStats[record.attendance_date]) {
          dateStats[record.attendance_date] = { present: 0, absent: 0, late: 0, total: 0 };
        }
        dateStats[record.attendance_date][record.status]++;
        dateStats[record.attendance_date].total++;
      });

      // 전체 통계
      const totalPresent = attendanceData?.filter(r => r.status === "present").length || 0;
      const totalAbsent = attendanceData?.filter(r => r.status === "absent").length || 0;
      const totalLate = attendanceData?.filter(r => r.status === "late").length || 0;
      const totalRecords = attendanceData?.length || 0;

      const attendanceRate = totalApplicants > 0 && totalRecords > 0 
        ? Math.round((totalPresent / totalRecords) * 100) 
        : 0;

      return {
        totalApplicants,
        totalPresent,
        totalAbsent, 
        totalLate,
        totalRecords,
        attendanceRate,
        dateStats,
      };
    },
    enabled: !!programId,
  });
};