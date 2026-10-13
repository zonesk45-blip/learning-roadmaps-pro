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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      bookmarks: {
        Row: {
          course_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      colleges: {
        Row: {
          country: string
          fees_usd: number
          id: string
          location: string
          name: string
          programs: string[]
          rating: number
          url: string | null
        }
        Insert: {
          country: string
          fees_usd: number
          id?: string
          location: string
          name: string
          programs?: string[]
          rating: number
          url?: string | null
        }
        Update: {
          country?: string
          fees_usd?: number
          id?: string
          location?: string
          name?: string
          programs?: string[]
          rating?: number
          url?: string | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          avg_salary_usd: number
          careers: string[]
          certificate: boolean
          created_at: string
          description: string | null
          domain: string
          duration_weeks: number
          featured: boolean
          format: string
          hours_per_week: number
          id: string
          institution: string | null
          job_demand: number
          language: string
          level: string
          price_usd: number
          provider: string
          rating: number
          reviews_count: number
          skills: string[]
          students_count: number
          title: string
          topic: string
          url: string | null
        }
        Insert: {
          avg_salary_usd?: number
          careers?: string[]
          certificate?: boolean
          created_at?: string
          description?: string | null
          domain: string
          duration_weeks: number
          featured?: boolean
          format?: string
          hours_per_week?: number
          id?: string
          institution?: string | null
          job_demand?: number
          language?: string
          level: string
          price_usd?: number
          provider: string
          rating?: number
          reviews_count?: number
          skills?: string[]
          students_count?: number
          title: string
          topic: string
          url?: string | null
        }
        Update: {
          avg_salary_usd?: number
          careers?: string[]
          certificate?: boolean
          created_at?: string
          description?: string | null
          domain?: string
          duration_weeks?: number
          featured?: boolean
          format?: string
          hours_per_week?: number
          id?: string
          institution?: string | null
          job_demand?: number
          language?: string
          level?: string
          price_usd?: number
          provider?: string
          rating?: number
          reviews_count?: number
          skills?: string[]
          students_count?: number
          title?: string
          topic?: string
          url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          budget_usd: number
          career_goal: string | null
          country: string | null
          created_at: string
          education_level: string | null
          email: string | null
          full_name: string | null
          hours_per_week: number
          id: string
          interests: string[]
          learning_style: string | null
          onboarded: boolean
          preferred_format: string | null
          preferred_level: string | null
          skills: string[]
          updated_at: string
        }
        Insert: {
          budget_usd?: number
          career_goal?: string | null
          country?: string | null
          created_at?: string
          education_level?: string | null
          email?: string | null
          full_name?: string | null
          hours_per_week?: number
          id: string
          interests?: string[]
          learning_style?: string | null
          onboarded?: boolean
          preferred_format?: string | null
          preferred_level?: string | null
          skills?: string[]
          updated_at?: string
        }
        Update: {
          budget_usd?: number
          career_goal?: string | null
          country?: string | null
          created_at?: string
          education_level?: string | null
          email?: string | null
          full_name?: string | null
          hours_per_week?: number
          id?: string
          interests?: string[]
          learning_style?: string | null
          onboarded?: boolean
          preferred_format?: string | null
          preferred_level?: string | null
          skills?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_name: string | null
          comment: string | null
          course_id: string
          created_at: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          author_name?: string | null
          comment?: string | null
          course_id: string
          created_at?: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          author_name?: string | null
          comment?: string | null
          course_id?: string
          created_at?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmaps: {
        Row: {
          created_at: string
          goal: string | null
          id: string
          steps: Json
          summary: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          goal?: string | null
          id?: string
          steps?: Json
          summary?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          goal?: string | null
          id?: string
          steps?: Json
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scholarships: {
        Row: {
          amount: string
          deadline: string
          domains: string[]
          eligibility: string
          id: string
          name: string
          sponsor: string
          url: string | null
        }
        Insert: {
          amount: string
          deadline: string
          domains?: string[]
          eligibility: string
          id?: string
          name: string
          sponsor: string
          url?: string | null
        }
        Update: {
          amount?: string
          deadline?: string
          domains?: string[]
          eligibility?: string
          id?: string
          name?: string
          sponsor?: string
          url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
