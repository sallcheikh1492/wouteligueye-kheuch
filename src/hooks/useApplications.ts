import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import {
  createApplication,
  fetchApplications,
  updateApplication,
  upsertApplicationStatus,
} from '@/services/applications'
import type { TablesInsert, TablesUpdate } from '@/types/database'

export function useApplications() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['applications', user?.id],
    queryFn: () => fetchApplications(user!.id),
    enabled: !!user,
  })
}

export function useCreateApplication() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<TablesInsert<'applications'>, 'user_id'>) =>
      createApplication({ ...input, user_id: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', user?.id] })
    },
  })
}

export function useSetApplicationStatus() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ jobId, status }: { jobId: string; status: TablesInsert<'applications'>['status'] }) =>
      upsertApplicationStatus({ user_id: user!.id, job_id: jobId, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['recent_applications', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats', user?.id] })
    },
  })
}

export function useUpdateApplication() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: TablesUpdate<'applications'> }) =>
      updateApplication(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', user?.id] })
    },
  })
}
