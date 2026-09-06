import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { fetchJobPreferences, upsertJobPreferences } from '@/services/jobPreferences'
import type { TablesInsert } from '@/types/database'

export function useJobPreferences() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['job_preferences', user?.id],
    queryFn: () => fetchJobPreferences(user!.id),
    enabled: !!user,
  })
}

export function useUpdateJobPreferences() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<TablesInsert<'job_preferences'>, 'user_id'>) =>
      upsertJobPreferences({ ...input, user_id: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job_preferences', user?.id] })
    },
  })
}
