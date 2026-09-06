import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { addJobSource, discoverJobs, fetchJobSources } from '@/services/jobSources'
import type { TablesInsert } from '@/types/database'

export function useJobSources() {
  return useQuery({
    queryKey: ['job_sources'],
    queryFn: fetchJobSources,
  })
}

export function useAddJobSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<TablesInsert<'job_sources'>, 'type'>) => addJobSource(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job_sources'] })
    },
  })
}

export function useDiscoverJobs() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: discoverJobs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job_sources'] })
      queryClient.invalidateQueries({ queryKey: ['job_matches', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['top_matches', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['recent_matches', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['recent_agent_runs', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats', user?.id] })
    },
  })
}
