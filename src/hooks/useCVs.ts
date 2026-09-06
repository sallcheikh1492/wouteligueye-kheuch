import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { analyzeCV, deleteCV, fetchCVs, setPrimaryCV, uploadCV } from '@/services/cvs'
import type { Tables } from '@/types/database'

export function useCVs() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['cvs', user?.id],
    queryFn: () => fetchCVs(user!.id),
    enabled: !!user,
  })
}

export function useUploadCV() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadCV(user!.id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cvs', user?.id] })
    },
  })
}

export function useSetPrimaryCV() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cvId: string) => setPrimaryCV(user!.id, cvId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cvs', user?.id] })
    },
  })
}

export function useDeleteCV() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cv: Tables<'cvs'>) => deleteCV(cv),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cvs', user?.id] })
    },
  })
}

export function useAnalyzeCV() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (cvId: string) => analyzeCV(cvId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cvs', user?.id] })
    },
  })
}
