import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { deleteJobMatch, fetchJobMatch, fetchMatchedJobs, type JobFilters } from '@/services/jobs'

export function useMatchedJobs(filters: JobFilters = {}) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['job_matches', user?.id, filters],
    queryFn: () => fetchMatchedJobs(user!.id, filters),
    enabled: !!user,
  })
}

export function useJobMatch(jobId: string | undefined) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['job_match', user?.id, jobId],
    queryFn: () => fetchJobMatch(user!.id, jobId!),
    enabled: !!user && !!jobId,
  })
}

export function useDismissJobMatch() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteJobMatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job_matches', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['top_matches', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['recent_matches', user?.id] })
    },
  })
}
