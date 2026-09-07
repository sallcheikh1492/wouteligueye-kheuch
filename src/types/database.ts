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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      agent_runs: {
        Row: {
          agent_type: Database["public"]["Enums"]["agent_type"]
          completed_at: string | null
          errors: Json
          id: string
          jobs_found: number
          jobs_matched: number
          jobs_processed: number
          metadata: Json
          started_at: string
          status: Database["public"]["Enums"]["agent_run_status"]
          user_id: string
        }
        Insert: {
          agent_type: Database["public"]["Enums"]["agent_type"]
          completed_at?: string | null
          errors?: Json
          id?: string
          jobs_found?: number
          jobs_matched?: number
          jobs_processed?: number
          metadata?: Json
          started_at?: string
          status?: Database["public"]["Enums"]["agent_run_status"]
          user_id: string
        }
        Update: {
          agent_type?: Database["public"]["Enums"]["agent_type"]
          completed_at?: string | null
          errors?: Json
          id?: string
          jobs_found?: number
          jobs_matched?: number
          jobs_processed?: number
          metadata?: Json
          started_at?: string
          status?: Database["public"]["Enums"]["agent_run_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          application_date: string | null
          application_url: string | null
          cover_letter: string | null
          created_at: string
          custom_answers: Json
          cv_id: string | null
          follow_up_date: string | null
          id: string
          job_id: string
          notes: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          application_date?: string | null
          application_url?: string | null
          cover_letter?: string | null
          created_at?: string
          custom_answers?: Json
          cv_id?: string | null
          follow_up_date?: string | null
          id?: string
          job_id: string
          notes?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          application_date?: string | null
          application_url?: string | null
          cover_letter?: string | null
          created_at?: string
          custom_answers?: Json
          cv_id?: string | null
          follow_up_date?: string | null
          id?: string
          job_id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_cv_id_fkey"
            columns: ["cv_id"]
            isOneToOne: false
            referencedRelation: "cvs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
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
      cvs: {
        Row: {
          created_at: string
          file_type: string
          file_url: string
          id: string
          is_primary: boolean
          name: string
          parsed_data: Json | null
          raw_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_type: string
          file_url: string
          id?: string
          is_primary?: boolean
          name: string
          parsed_data?: Json | null
          raw_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_type?: string
          file_url?: string
          id?: string
          is_primary?: boolean
          name?: string
          parsed_data?: Json | null
          raw_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cvs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_documents: {
        Row: {
          application_id: string | null
          content: string | null
          created_at: string
          file_url: string | null
          id: string
          job_id: string | null
          metadata: Json
          type: Database["public"]["Enums"]["generated_document_type"]
          user_id: string
        }
        Insert: {
          application_id?: string | null
          content?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          job_id?: string | null
          metadata?: Json
          type: Database["public"]["Enums"]["generated_document_type"]
          user_id: string
        }
        Update: {
          application_id?: string | null
          content?: string | null
          created_at?: string
          file_url?: string | null
          id?: string
          job_id?: string | null
          metadata?: Json
          type?: Database["public"]["Enums"]["generated_document_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_matches: {
        Row: {
          ai_analysis: Json | null
          created_at: string
          education_score: number | null
          experience_score: number | null
          id: string
          job_id: string
          keywords_score: number | null
          location_score: number | null
          missing_skills: Json
          overall_score: number
          recommendation: string | null
          skills_score: number | null
          strengths: Json
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          created_at?: string
          education_score?: number | null
          experience_score?: number | null
          id?: string
          job_id: string
          keywords_score?: number | null
          location_score?: number | null
          missing_skills?: Json
          overall_score: number
          recommendation?: string | null
          skills_score?: number | null
          strengths?: Json
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          created_at?: string
          education_score?: number | null
          experience_score?: number | null
          id?: string
          job_id?: string
          keywords_score?: number | null
          location_score?: number | null
          missing_skills?: Json
          overall_score?: number
          recommendation?: string | null
          skills_score?: number | null
          strengths?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_matches_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_matches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_preferences: {
        Row: {
          auto_apply_enabled: boolean
          created_at: string
          desired_titles: Json
          employment_types: Database["public"]["Enums"]["employment_type"][]
          excluded_keywords: Json
          id: string
          keywords: Json
          minimum_match_score: number
          minimum_salary: number | null
          preferred_locations: Json
          remote_preference: Database["public"]["Enums"]["remote_preference"]
          search_frequency: Database["public"]["Enums"]["search_frequency"]
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_apply_enabled?: boolean
          created_at?: string
          desired_titles?: Json
          employment_types?: Database["public"]["Enums"]["employment_type"][]
          excluded_keywords?: Json
          id?: string
          keywords?: Json
          minimum_match_score?: number
          minimum_salary?: number | null
          preferred_locations?: Json
          remote_preference?: Database["public"]["Enums"]["remote_preference"]
          search_frequency?: Database["public"]["Enums"]["search_frequency"]
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_apply_enabled?: boolean
          created_at?: string
          desired_titles?: Json
          employment_types?: Database["public"]["Enums"]["employment_type"][]
          excluded_keywords?: Json
          id?: string
          keywords?: Json
          minimum_match_score?: number
          minimum_salary?: number | null
          preferred_locations?: Json
          remote_preference?: Database["public"]["Enums"]["remote_preference"]
          search_frequency?: Database["public"]["Enums"]["search_frequency"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_sources: {
        Row: {
          api_available: boolean
          created_at: string
          id: string
          is_active: boolean
          last_checked_at: string | null
          name: string
          type: Database["public"]["Enums"]["job_source_type"]
          url: string | null
        }
        Insert: {
          api_available?: boolean
          created_at?: string
          id?: string
          is_active?: boolean
          last_checked_at?: string | null
          name: string
          type: Database["public"]["Enums"]["job_source_type"]
          url?: string | null
        }
        Update: {
          api_available?: boolean
          created_at?: string
          id?: string
          is_active?: boolean
          last_checked_at?: string | null
          name?: string
          type?: Database["public"]["Enums"]["job_source_type"]
          url?: string | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          ai_analysis: Json | null
          application_url: string | null
          company: string
          created_at: string
          currency: string | null
          description: string | null
          employment_type: Database["public"]["Enums"]["employment_type"] | null
          expires_at: string | null
          external_id: string | null
          id: string
          location: string | null
          published_at: string | null
          raw_data: Json | null
          requirements: string | null
          salary_max: number | null
          salary_min: number | null
          source_id: string
          status: Database["public"]["Enums"]["job_status"]
          title: string
        }
        Insert: {
          ai_analysis?: Json | null
          application_url?: string | null
          company: string
          created_at?: string
          currency?: string | null
          description?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          expires_at?: string | null
          external_id?: string | null
          id?: string
          location?: string | null
          published_at?: string | null
          raw_data?: Json | null
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          source_id: string
          status?: Database["public"]["Enums"]["job_status"]
          title: string
        }
        Update: {
          ai_analysis?: Json | null
          application_url?: string | null
          company?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          expires_at?: string | null
          external_id?: string | null
          id?: string
          location?: string | null
          published_at?: string | null
          raw_data?: Json | null
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          source_id?: string
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "job_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_job_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_job_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_job_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_job_id_fkey"
            columns: ["related_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          github_url: string | null
          id: string
          linkedin_url: string | null
          location: string | null
          phone: string | null
          portfolio_url: string | null
          professional_summary: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          github_url?: string | null
          id: string
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          portfolio_url?: string | null
          professional_summary?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          portfolio_url?: string | null
          professional_summary?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: Database["public"]["Enums"]["skill_category"]
          created_at: string
          id: string
          level: Database["public"]["Enums"]["skill_level"] | null
          name: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          category: Database["public"]["Enums"]["skill_category"]
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["skill_level"] | null
          name: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["skill_category"]
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["skill_level"] | null
          name?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      seed_demo_profile: { Args: never; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      agent_run_status: "running" | "completed" | "failed" | "partial"
      agent_type:
        | "cv_analysis"
        | "job_discovery"
        | "job_matching"
        | "cover_letter_generation"
        | "cv_optimization"
        | "scheduled_job_search"
      application_status:
        | "discovered"
        | "reviewing"
        | "interested"
        | "documents_ready"
        | "ready_to_apply"
        | "submitted"
        | "interview"
        | "rejected"
        | "accepted"
        | "withdrawn"
        | "no_response"
      employment_type:
        | "full_time"
        | "part_time"
        | "contract"
        | "internship"
        | "freelance"
      generated_document_type:
        | "optimized_cv"
        | "cover_letter"
        | "application_answers"
      job_source_type:
        | "official_api"
        | "rss_feed"
        | "company_career_page"
        | "manual"
      job_status: "active" | "expired" | "closed" | "duplicate"
      notification_type:
        | "new_match"
        | "deadline_reminder"
        | "follow_up_reminder"
        | "status_change"
        | "agent_summary"
      remote_preference: "onsite" | "hybrid" | "remote" | "any"
      search_frequency: "every_6_hours" | "every_12_hours" | "daily" | "weekly"
      skill_category:
        | "programming"
        | "database"
        | "business_intelligence"
        | "data_analysis"
        | "machine_learning"
        | "big_data"
        | "cloud"
        | "soft_skills"
      skill_level: "beginner" | "intermediate" | "advanced" | "expert"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      agent_run_status: ["running", "completed", "failed", "partial"],
      agent_type: [
        "cv_analysis",
        "job_discovery",
        "job_matching",
        "cover_letter_generation",
        "cv_optimization",
        "scheduled_job_search",
      ],
      application_status: [
        "discovered",
        "reviewing",
        "interested",
        "documents_ready",
        "ready_to_apply",
        "submitted",
        "interview",
        "rejected",
        "accepted",
        "withdrawn",
        "no_response",
      ],
      employment_type: [
        "full_time",
        "part_time",
        "contract",
        "internship",
        "freelance",
      ],
      generated_document_type: [
        "optimized_cv",
        "cover_letter",
        "application_answers",
      ],
      job_source_type: [
        "official_api",
        "rss_feed",
        "company_career_page",
        "manual",
      ],
      job_status: ["active", "expired", "closed", "duplicate"],
      notification_type: [
        "new_match",
        "deadline_reminder",
        "follow_up_reminder",
        "status_change",
        "agent_summary",
      ],
      remote_preference: ["onsite", "hybrid", "remote", "any"],
      search_frequency: ["every_6_hours", "every_12_hours", "daily", "weekly"],
      skill_category: [
        "programming",
        "database",
        "business_intelligence",
        "data_analysis",
        "machine_learning",
        "big_data",
        "cloud",
        "soft_skills",
      ],
      skill_level: ["beginner", "intermediate", "advanced", "expert"],
    },
  },
} as const

// Convenience aliases used throughout the app, derived from the generated
// Enums<> helper above so they can never drift from the live schema.
export type SkillCategory = Enums<'skill_category'>
export type SkillLevel = Enums<'skill_level'>
export type EmploymentType = Enums<'employment_type'>
export type RemotePreference = Enums<'remote_preference'>
export type SearchFrequency = Enums<'search_frequency'>
export type JobSourceType = Enums<'job_source_type'>
export type JobStatus = Enums<'job_status'>
export type ApplicationStatus = Enums<'application_status'>
export type GeneratedDocumentType = Enums<'generated_document_type'>
export type AgentType = Enums<'agent_type'>
export type AgentRunStatus = Enums<'agent_run_status'>
export type NotificationType = Enums<'notification_type'>
