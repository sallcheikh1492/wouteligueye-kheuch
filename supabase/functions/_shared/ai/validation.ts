// Every AI response is validated against these schemas before it is used to
// compute a score or persisted to the database (spec section 25: "Valider
// toutes les réponses IA avant enregistrement dans la base de données").
import { z } from 'npm:zod@3.23.8'

const SKILL_CATEGORIES = [
  'programming',
  'database',
  'business_intelligence',
  'data_analysis',
  'machine_learning',
  'big_data',
  'cloud',
  'soft_skills',
] as const

export const cvAnalysisSchema = z.object({
  summary: z.string(),
  skills: z.array(z.object({ name: z.string(), category: z.enum(SKILL_CATEGORIES) })),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string().optional(),
      field: z.string().optional(),
      start_date: z.string().optional(),
      end_date: z.string().optional(),
    }),
  ),
  experience: z.array(
    z.object({
      company: z.string(),
      title: z.string(),
      start_date: z.string().optional(),
      end_date: z.string().optional(),
      description: z.string().optional(),
    }),
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      technologies: z.array(z.string()).optional(),
    }),
  ),
  languages: z.array(z.object({ name: z.string(), level: z.string().optional() })),
  certifications: z.array(
    z.object({ name: z.string(), issuer: z.string().optional(), date: z.string().optional() }),
  ),
})

export const jobAnalysisSchema = z.object({
  summary: z.string(),
  required_skills: z.array(z.string()),
  preferred_skills: z.array(z.string()),
  seniority_level: z.string(),
  key_responsibilities: z.array(z.string()),
})

export const aiContextSchema = z.object({
  ai_context_score: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  reasoning_summary: z.string(),
})

export const coverLetterSchema = z.string().trim().min(50)

export const webSearchJobSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  application_url: z.string().url(),
  published_at: z.string().nullable().optional(),
})

export const webSearchResultsSchema = z.array(webSearchJobSchema).max(20)

export const optimizedCVSchema = z.object({
  summary: z.string(),
  highlighted_skills: z.array(z.string()),
  reordered_experience: z.array(
    z.object({
      company: z.string(),
      title: z.string(),
      start_date: z.string().optional(),
      end_date: z.string().optional(),
      description: z.string().optional(),
    }),
  ),
})
