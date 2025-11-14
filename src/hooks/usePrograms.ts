import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { supabasePublic } from "@/integrations/supabase/publicClient";
import { toast } from "sonner";

export interface Program {
  id: number;
  title: string;
  category: string | null;
  region: string | null;
  start_at: string | null;
  end_at: string | null;
  capacity: number | null;
  image_url: string | null;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  status: string | null;
}

export interface ProgramInput {
  title: string;
  category?: string;
  region?: string;
  start_at?: string;
  end_at?: string;
  capacity?: number;
  image_url?: string;
  description?: string;
}

// 프로그램 목록 조회
export const usePrograms = (onlyMyPrograms = false) => {
  return useQuery({
    queryKey: ["programs", onlyMyPrograms],
    queryFn: async () => {
      console.log("Fetching programs from Supabase...", { onlyMyPrograms });

      try {
        let query = supabase.from("programs").select("*");
        
        if (onlyMyPrograms) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            query = query.eq("created_by", user.id);
          } else {
            return [];
          }
        }

        // Execute query and capture response
        const { data, error } = await query.order("created_at", { ascending: false });

        console.log('Programs data:', data);
        console.log('Programs error:', error);

        if (error) {
          console.error("Error fetching programs (detailed):", error);
          
          // If RLS permission denied error, return empty array to prevent crash
          if (error.code === '42501' || error.message?.includes('permission denied')) {
            console.warn('RLS permission denied - please fix database policies for anon access');
            return [];
          }
          
          throw error;
        }

        return data as Program[];
      } catch (err) {
        console.error("Unexpected error in usePrograms:", err);
        return [];
      }
    },
  });
};

// 프로그램 추가
export const useCreateProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (program: ProgramInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      const programData = {
        ...program,
        created_by: user?.id
      };
      
      const { data, error } = await supabase
        .from("programs")
        .insert([programData])
        .select()
        .single();

      if (error) {
        console.error("Error creating program:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast.success("프로그램이 성공적으로 추가되었습니다.");
    },
    onError: (error) => {
      console.error("Create program error:", error);
      toast.error("프로그램 추가에 실패했습니다.");
    },
  });
};

// 프로그램 수정
export const useUpdateProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...program }: { id: number } & ProgramInput) => {
      const { data, error } = await supabase
        .from("programs")
        .update(program)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating program:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast.success("프로그램이 성공적으로 수정되었습니다.");
    },
    onError: (error) => {
      console.error("Update program error:", error);
      toast.error("프로그램 수정에 실패했습니다.");
    },
  });
};

// 프로그램 삭제
export const useDeleteProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("programs")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting program:", error);
        throw error;
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast.success("프로그램이 성공적으로 삭제되었습니다.");
    },
    onError: (error) => {
      console.error("Delete program error:", error);
      toast.error("프로그램 삭제에 실패했습니다.");
    },
  });
};

// 프로그램 완료 처리
export const useCompleteProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data, error } = await supabase
        .from("programs")
        .update({ status: 'completed' })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error completing program:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast.success("프로그램이 완료 처리되었습니다.");
    },
    onError: (error) => {
      console.error("Complete program error:", error);
      toast.error("프로그램 완료 처리에 실패했습니다.");
    },
  });
};