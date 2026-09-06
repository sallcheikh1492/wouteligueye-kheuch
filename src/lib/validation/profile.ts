import { z } from 'zod'

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || z.string().url().safeParse(value).success, 'URL invalide')

export const profileSchema = z.object({
  full_name: z.string().trim().min(1, 'Le nom est requis'),
  location: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  linkedin_url: optionalUrl,
  portfolio_url: optionalUrl,
  github_url: optionalUrl,
  professional_summary: z.string().trim().optional(),
})
export type ProfileValues = z.infer<typeof profileSchema>

export const skillSchema = z.object({
  name: z.string().trim().min(1, 'Le nom de la compétence est requis'),
  category: z.enum([
    'programming',
    'database',
    'business_intelligence',
    'data_analysis',
    'machine_learning',
    'big_data',
    'cloud',
    'soft_skills',
  ]),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
})
export type SkillValues = z.infer<typeof skillSchema>
