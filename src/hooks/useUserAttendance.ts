import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface UserAttendanceRecord {
  id: number;
  attendance_date: string;
  status: "present" | "absent" | "late";
  program_id: number;
  program_title: string;
  created_at: string;
}

// 사용자의 모든 출석 기록 조회
export const useUserAttendanceRecords = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["user-attendance-records", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("사용자가 로그인되지 않았습니다.");

      // 승인된 신청 프로그램들의 출석 기록만 조회
      const { data: attendanceData, error } = await supabase
        .from("attendance")
        .select(`
          id,
          attendance_date,
          status,
          program_id,
          created_at,
          programs!inner(
            id,
            title,
            start_at,
            end_at
          )
        `)
        .eq("user_id", user.id)
        .order("attendance_date", { ascending: false });

      if (error) {
        console.error("Error fetching user attendance:", error);
        throw error;
      }

      // 데이터 변환
      const formattedData: UserAttendanceRecord[] = attendanceData?.map(record => ({
        id: record.id,
        attendance_date: record.attendance_date,
        status: record.status as "present" | "absent" | "late",
        program_id: record.program_id,
        program_title: (record.programs as any).title,
        created_at: record.created_at,
      })) || [];

      return formattedData;
    },
    enabled: !!user?.id,
  });
};

// 특정 프로그램의 사용자 출석 기록 조회
export const useUserProgramAttendance = (programId: number) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["user-program-attendance", user?.id, programId],
    queryFn: async () => {
      if (!user?.id || !programId) return [];

      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", user.id)
        .eq("program_id", programId)
        .order("attendance_date", { ascending: true });

      if (error) {
        console.error("Error fetching user program attendance:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id && !!programId,
  });
};