import { z } from 'zod'

export const manualJobSchema = z.object({
  title: z.string().trim().min(1, 'Le poste est requis').max(300),
  company: z.string().trim().min(1, "L'entreprise est requise").max(300),
  location: z.string().trim().max(300).optional(),
  application_url: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.string().url().safeParse(value).success, 'URL invalide'),
  description: z.string().trim().max(20000).optional(),
})
export type ManualJobValues = z.infer<typeof manualJobSchema>
