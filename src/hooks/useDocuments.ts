import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import {
  fetchJobDocuments,
  generateCoverLetter,
  optimizeCV,
  updateDocumentContent,
} from '@/services/documents'
import type { CoverLetterTone } from '@/types/cv'
import type { TablesUpdate } from '@/types/database'

export function useJobDocuments(jobId: string | undefined) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['job_documents', user?.id, jobId],
    queryFn: () => fetchJobDocuments(user!.id, jobId!),
    enabled: !!user && !!jobId,
  })
}

export function useGenerateCoverLetter(jobId: string | undefined) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (tone: CoverLetterTone) => generateCoverLetter(jobId!, tone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job_documents', user?.id, jobId] })
      queryClient.invalidateQueries({ queryKey: ['applications', user?.id] })
    },
  })
}

export function useOptimizeCV(jobId: string | undefined) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => optimizeCV(jobId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job_documents', user?.id, jobId] })
      queryClient.invalidateQueries({ queryKey: ['applications', user?.id] })
    },
  })
}

export function useUpdateDocument(jobId: string | undefined) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: TablesUpdate<'generated_documents'> }) =>
      updateDocumentContent(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job_documents', user?.id, jobId] })
    },
  })
}
