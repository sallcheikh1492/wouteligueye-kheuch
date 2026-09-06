// Hand-written to match supabase/migrations/*.sql exactly.
// Once a Supabase project is linked, regenerate with:
//   npx supabase gen types typescript --linked > src/types/database.ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type SkillCategory =
  | 'programming'
  | 'database'
  | 'business_intelligence'
  | 'data_analysis'
  | 'machine_learning'
  | 'big_data'
  | 'cloud'
  | 'soft_skills'

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance'

export type RemotePreference = 'onsite' | 'hybrid' | 'remote' | 'any'

export type SearchFrequency = 'every_6_hours' | 'every_12_hours' | 'daily' | 'weekly'

export type JobSourceType = 'official_api' | 'rss_feed' | 'company_career_page' | 'manual'

export type JobStatus = 'active' | 'expired' | 'closed' | 'duplicate'

export type ApplicationStatus =
  | 'discovered'
  | 'reviewing'
  | 'interested'
  | 'documents_ready'
  | 'ready_to_apply'
  | 'submitted'
  | 'interview'
  | 'rejected'
  | 'accepted'
  | 'withdrawn'
  | 'no_response'

export type GeneratedDocumentType = 'optimized_cv' | 'cover_letter' | 'application_answers'

export type AgentType =
  | 'cv_analysis'
  | 'job_discovery'
  | 'job_matching'
  | 'cover_letter_generation'
  | 'cv_optimization'
  | 'scheduled_job_search'

export type AgentRunStatus = 'running' | 'completed' | 'failed' | 'partial'

export type NotificationType =
  | 'new_match'
  | 'deadline_reminder'
  | 'follow_up_reminder'
  | 'status_change'
  | 'agent_summary'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string
          phone: string | null
          location: string | null
          linkedin_url: string | null
          portfolio_url: string | null
          github_url: string | null
          professional_summary: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email: string
          phone?: string | null
          location?: string | null
          linkedin_url?: string | null
          portfolio_url?: string | null
          github_url?: string | null
          professional_summary?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      cvs: {
        Row: {
          id: string
          user_id: string
          name: string
          file_url: string
          file_type: string
          is_primary: boolean
          raw_text: string | null
          parsed_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          file_url: string
          file_type: string
          is_primary?: boolean
          raw_text?: string | null
          parsed_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['cvs']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'cvs_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      skills: {
        Row: {
          id: string
          user_id: string
          name: string
          category: SkillCategory
          level: SkillLevel | null
          years_experience: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          category: SkillCategory
          level?: SkillLevel | null
          years_experience?: number | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['skills']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'skills_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      job_preferences: {
        Row: {
          id: string
          user_id: string
          desired_titles: Json
          preferred_locations: Json
          employment_types: EmploymentType[]
          remote_preference: RemotePreference
          minimum_salary: number | null
          keywords: Json
          excluded_keywords: Json
          search_frequency: SearchFrequency
          auto_apply_enabled: boolean
          minimum_match_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          desired_titles?: Json
          preferred_locations?: Json
          employment_types?: EmploymentType[]
          remote_preference?: RemotePreference
          minimum_salary?: number | null
          keywords?: Json
          excluded_keywords?: Json
          search_frequency?: SearchFrequency
          auto_apply_enabled?: boolean
          minimum_match_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['job_preferences']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'job_preferences_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      job_sources: {
        Row: {
          id: string
          name: string
          url: string | null
          type: JobSourceType
          is_active: boolean
          api_available: boolean
          last_checked_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          url?: string | null
          type: JobSourceType
          is_active?: boolean
          api_available?: boolean
          last_checked_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['job_sources']['Insert']>
        Relationships: []
      }
      jobs: {
        Row: {
          id: string
          external_id: string | null
          source_id: string
          title: string
          company: string
          location: string | null
          description: string | null
          requirements: string | null
          employment_type: EmploymentType | null
          salary_min: number | null
          salary_max: number | null
          currency: string | null
          application_url: string | null
          published_at: string | null
          expires_at: string | null
          raw_data: Json | null
          status: JobStatus
          created_at: string
        }
        Insert: {
          id?: string
          external_id?: string | null
          source_id: string
          title: string
          company: string
          location?: string | null
          description?: string | null
          requirements?: string | null
          employment_type?: EmploymentType | null
          salary_min?: number | null
          salary_max?: number | null
          currency?: string | null
          application_url?: string | null
          published_at?: string | null
          expires_at?: string | null
          raw_data?: Json | null
          status?: JobStatus
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['jobs']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'jobs_source_id_fkey'
            columns: ['source_id']
            referencedRelation: 'job_sources'
            referencedColumns: ['id']
          },
        ]
      }
      job_matches: {
        Row: {
          id: string
          job_id: string
          user_id: string
          overall_score: number
          skills_score: number | null
          experience_score: number | null
          education_score: number | null
          location_score: number | null
          keywords_score: number | null
          ai_analysis: Json | null
          missing_skills: Json
          strengths: Json
          recommendation: string | null
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          user_id: string
          overall_score: number
          skills_score?: number | null
          experience_score?: number | null
          education_score?: number | null
          location_score?: number | null
          keywords_score?: number | null
          ai_analysis?: Json | null
          missing_skills?: Json
          strengths?: Json
          recommendation?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['job_matches']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'job_matches_job_id_fkey'
            columns: ['job_id']
            referencedRelation: 'jobs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'job_matches_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      applications: {
        Row: {
          id: string
          user_id: string
          job_id: string
          cv_id: string | null
          status: ApplicationStatus
          application_date: string | null
          application_url: string | null
          cover_letter: string | null
          custom_answers: Json
          notes: string | null
          follow_up_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_id: string
          cv_id?: string | null
          status?: ApplicationStatus
          application_date?: string | null
          application_url?: string | null
          cover_letter?: string | null
          custom_answers?: Json
          notes?: string | null
          follow_up_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['applications']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'applications_job_id_fkey'
            columns: ['job_id']
            referencedRelation: 'jobs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'applications_cv_id_fkey'
            columns: ['cv_id']
            referencedRelation: 'cvs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'applications_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      generated_documents: {
        Row: {
          id: string
          user_id: string
          job_id: string | null
          application_id: string | null
          type: GeneratedDocumentType
          content: string | null
          file_url: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          job_id?: string | null
          application_id?: string | null
          type: GeneratedDocumentType
          content?: string | null
          file_url?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['generated_documents']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'generated_documents_job_id_fkey'
            columns: ['job_id']
            referencedRelation: 'jobs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'generated_documents_application_id_fkey'
            columns: ['application_id']
            referencedRelation: 'applications'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'generated_documents_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      agent_runs: {
        Row: {
          id: string
          user_id: string
          agent_type: AgentType
          status: AgentRunStatus
          started_at: string
          completed_at: string | null
          jobs_found: number
          jobs_processed: number
          jobs_matched: number
          errors: Json
          metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          agent_type: AgentType
          status?: AgentRunStatus
          started_at?: string
          completed_at?: string | null
          jobs_found?: number
          jobs_processed?: number
          jobs_matched?: number
          errors?: Json
          metadata?: Json
        }
        Update: Partial<Database['public']['Tables']['agent_runs']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'agent_runs_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: NotificationType
          related_job_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: NotificationType
          related_job_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'notifications_related_job_id_fkey'
            columns: ['related_job_id']
            referencedRelation: 'jobs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      seed_demo_profile: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      skill_category: SkillCategory
      skill_level: SkillLevel
      employment_type: EmploymentType
      remote_preference: RemotePreference
      search_frequency: SearchFrequency
      job_source_type: JobSourceType
      job_status: JobStatus
      application_status: ApplicationStatus
      generated_document_type: GeneratedDocumentType
      agent_type: AgentType
      agent_run_status: AgentRunStatus
      notification_type: NotificationType
    }
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
