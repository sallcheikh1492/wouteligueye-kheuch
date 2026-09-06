// Mirrors supabase/functions/_shared/ai/types.ts (CVAnalysis) — kept in sync
// by hand since Edge Functions (Deno) and the frontend (Vite) don't share a
// TypeScript project.
import type { SkillCategory } from '@/types/database'

export type CVSkill = {
  name: string
  category: SkillCategory
}

export type CVEducation = {
  institution: string
  degree?: string
  field?: string
  start_date?: string
  end_date?: string
}

export type CVExperience = {
  company: string
  title: string
  start_date?: string
  end_date?: string
  description?: string
}

export type CVProject = {
  name: string
  description?: string
  technologies?: string[]
}

export type CVLanguage = {
  name: string
  level?: string
}

export type CVCertification = {
  name: string
  issuer?: string
  date?: string
}

export type CVAnalysis = {
  summary: string
  skills: CVSkill[]
  education: CVEducation[]
  experience: CVExperience[]
  projects: CVProject[]
  languages: CVLanguage[]
  certifications: CVCertification[]
}

export type OptimizedCV = {
  summary: string
  highlighted_skills: string[]
  reordered_experience: CVExperience[]
}

export type CoverLetterTone = 'formal' | 'enthusiastic' | 'concise'

export const ACCEPTED_CV_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

export const MAX_CV_FILE_SIZE_BYTES = 10 * 1024 * 1024
