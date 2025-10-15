export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_requests: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          created_at: string | null
          id: number
          program_id: number
          status: Database["public"]["Enums"]["app_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          program_id: number
          status?: Database["public"]["Enums"]["app_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          program_id?: number
          status?: Database["public"]["Enums"]["app_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          attendance_date: string
          created_at: string
          id: number
          notes: string | null
          program_id: number
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          attendance_date: string
          created_at?: string
          id?: number
          notes?: string | null
          program_id: number
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          attendance_date?: string
          created_at?: string
          id?: number
          notes?: string | null
          program_id?: number
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          active: boolean | null
          created_at: string | null
          href: string | null
          id: number
          image_url: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          href?: string | null
          id?: number
          image_url: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          href?: string | null
          id?: number
          image_url?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: number
          is_hidden: boolean | null
          post_id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: number
          is_hidden?: boolean | null
          post_id: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: number
          is_hidden?: boolean | null
          post_id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_forms: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: number
          is_active: boolean
          program_id: number
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: number
          is_active?: boolean
          program_id: number
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: number
          is_active?: boolean
          program_id?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      consent_submissions: {
        Row: {
          address: string | null
          agreed: boolean
          birth_date: string | null
          consent_form_id: number
          created_at: string
          gender: string | null
          id: number
          institution: string | null
          name: string | null
          phone: string | null
          signature: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          agreed?: boolean
          birth_date?: string | null
          consent_form_id: number
          created_at?: string
          gender?: string | null
          id?: number
          institution?: string | null
          name?: string | null
          phone?: string | null
          signature?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          agreed?: boolean
          birth_date?: string | null
          consent_form_id?: number
          created_at?: string
          gender?: string | null
          id?: number
          institution?: string | null
          name?: string | null
          phone?: string | null
          signature?: string | null
          user_id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string | null
          id: number
          post_id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          post_id: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          post_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          category: Database["public"]["Enums"]["post_category"]
          content: string
          created_at: string | null
          id: number
          is_hidden: boolean | null
          region: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["post_category"]
          content: string
          created_at?: string | null
          id?: number
          is_hidden?: boolean | null
          region?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["post_category"]
          content?: string
          created_at?: string | null
          id?: number
          is_hidden?: boolean | null
          region?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_group: string | null
          available_time: string | null
          created_at: string | null
          email: string | null
          gender: string | null
          id: string
          learning_purpose: string | null
          learning_style: string | null
          name: string | null
          nickname: string | null
          onboarding_completed: boolean | null
          preferred_category: string | null
          region: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          age_group?: string | null
          available_time?: string | null
          created_at?: string | null
          email?: string | null
          gender?: string | null
          id: string
          learning_purpose?: string | null
          learning_style?: string | null
          name?: string | null
          nickname?: string | null
          onboarding_completed?: boolean | null
          preferred_category?: string | null
          region?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          age_group?: string | null
          available_time?: string | null
          created_at?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          learning_purpose?: string | null
          learning_style?: string | null
          name?: string | null
          nickname?: string | null
          onboarding_completed?: boolean | null
          preferred_category?: string | null
          region?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      programs: {
        Row: {
          capacity: number | null
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_at: string | null
          id: number
          image_url: string | null
          region: string | null
          start_at: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          id?: number
          image_url?: string | null
          region?: string | null
          start_at?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          id?: number
          image_url?: string | null
          region?: string | null
          start_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          created_at: string
          id: number
          responses: Json
          survey_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          responses?: Json
          survey_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          responses?: Json
          survey_id?: number
          user_id?: string
        }
        Relationships: []
      }
      surveys: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: number
          is_active: boolean
          program_id: number
          questions: Json
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: number
          is_active?: boolean
          program_id: number
          questions?: Json
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: number
          is_active?: boolean
          program_id?: number
          questions?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      elevate_to_admin: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_post_stats: {
        Args: { post_id_param: number }
        Returns: {
          comment_count: number
          like_count: number
          user_liked: boolean
        }[]
      }
      get_survey_responses_with_profiles: {
        Args: { survey_id_param: number }
        Returns: {
          created_at: string
          id: number
          name: string
          nickname: string
          region: string
          responses: Json
          survey_id: number
          user_id: string
        }[]
      }
      is_admin: {
        Args: { uid?: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: { uid?: string }
        Returns: boolean
      }
      request_admin_role: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      review_admin_request: {
        Args: { approve: boolean; request_id: string; review_reason?: string }
        Returns: undefined
      }
      revoke_admin_role: {
        Args: { target_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_status: "pending" | "approved" | "cancelled"
      attendance_status: "present" | "absent" | "late"
      post_category: "맛집" | "행사" | "생활" | "고민" | "일반"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_status: ["pending", "approved", "cancelled"],
      attendance_status: ["present", "absent", "late"],
      post_category: ["맛집", "행사", "생활", "고민", "일반"],
    },
  },
} as const
