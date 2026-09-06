import { supabase } from '@/integrations/supabase/client'
import type { Tables } from '@/types/database'
import { ACCEPTED_CV_MIME_TYPES, MAX_CV_FILE_SIZE_BYTES, type CVAnalysis } from '@/types/cv'

export async function fetchCVs(userId: string): Promise<Tables<'cvs'>[]> {
  const { data, error } = await supabase
    .from('cvs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function uploadCV(userId: string, file: File): Promise<Tables<'cvs'>> {
  if (!ACCEPTED_CV_MIME_TYPES.includes(file.type as (typeof ACCEPTED_CV_MIME_TYPES)[number])) {
    throw new Error('Format non supporté : seuls les fichiers PDF et DOCX sont acceptés.')
  }
  if (file.size > MAX_CV_FILE_SIZE_BYTES) {
    throw new Error('Le fichier dépasse la taille maximale de 10 Mo.')
  }

  const extension = file.name.split('.').pop() ?? 'pdf'
  const path = `${userId}/${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage.from('cvs').upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (uploadError) throw uploadError

  const { count } = await supabase
    .from('cvs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const { data, error } = await supabase
    .from('cvs')
    .insert({
      user_id: userId,
      name: file.name,
      file_url: path,
      file_type: file.type,
      is_primary: (count ?? 0) === 0,
    })
    .select()
    .single()

  if (error) {
    // Roll back the uploaded object if the DB insert failed, to avoid orphaned files.
    await supabase.storage.from('cvs').remove([path])
    throw error
  }

  return data
}

export async function setPrimaryCV(userId: string, cvId: string) {
  const { error: unsetError } = await supabase
    .from('cvs')
    .update({ is_primary: false })
    .eq('user_id', userId)
    .eq('is_primary', true)
  if (unsetError) throw unsetError

  const { error: setError } = await supabase.from('cvs').update({ is_primary: true }).eq('id', cvId)
  if (setError) throw setError
}

export async function deleteCV(cv: Tables<'cvs'>) {
  const { error: storageError } = await supabase.storage.from('cvs').remove([cv.file_url])
  if (storageError) throw storageError

  const { error } = await supabase.from('cvs').delete().eq('id', cv.id)
  if (error) throw error
}

export async function analyzeCV(cvId: string): Promise<CVAnalysis> {
  const { data, error } = await supabase.functions.invoke<{ analysis: CVAnalysis; error?: string }>(
    'analyze-cv',
    { body: { cv_id: cvId } },
  )
  if (error) throw error
  if (!data || data.error) throw new Error(data?.error ?? "Échec de l'analyse du CV")
  return data.analysis
}
