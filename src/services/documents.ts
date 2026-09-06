import { supabase } from '@/integrations/supabase/client'
import type { Tables, TablesUpdate } from '@/types/database'
import type { CoverLetterTone, OptimizedCV } from '@/types/cv'

export async function fetchJobDocuments(userId: string, jobId: string): Promise<Tables<'generated_documents'>[]> {
  const { data, error } = await supabase
    .from('generated_documents')
    .select('*')
    .eq('user_id', userId)
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function generateCoverLetter(jobId: string, tone: CoverLetterTone) {
  const { data, error } = await supabase.functions.invoke<{
    content: string
    document: Tables<'generated_documents'>
    error?: string
  }>('generate-cover-letter', { body: { job_id: jobId, tone } })
  if (error) throw error
  if (!data || data.error) throw new Error(data?.error ?? 'Échec de la génération de la lettre')
  return data
}

export async function optimizeCV(jobId: string) {
  const { data, error } = await supabase.functions.invoke<{
    optimized: OptimizedCV
    document: Tables<'generated_documents'>
    error?: string
  }>('optimize-cv', { body: { job_id: jobId } })
  if (error) throw error
  if (!data || data.error) throw new Error(data?.error ?? "Échec de l'optimisation du CV")
  return data
}

export async function updateDocumentContent(id: string, patch: TablesUpdate<'generated_documents'>) {
  const { data, error } = await supabase
    .from('generated_documents')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
