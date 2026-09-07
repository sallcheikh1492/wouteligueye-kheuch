import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { fetchAdminUsers, fetchIsAdmin, manageUser, type AdminAction } from '@/services/admin'

export function useIsAdmin() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['is_admin', user?.id],
    queryFn: () => fetchIsAdmin(user!.id),
    enabled: !!user,
    staleTime: 5 * 60_000,
  })
}

export function useAdminUsers() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['admin_users_list', user?.id],
    queryFn: fetchAdminUsers,
    enabled: !!user,
  })
}

export function useManageUser() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ action, userId }: { action: AdminAction; userId: string }) => manageUser(action, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users_list', user?.id] })
    },
  })
}
