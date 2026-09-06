import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notifications'

export function useNotifications(limit = 20) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['notifications', user?.id, limit],
    queryFn: () => fetchNotifications(user!.id, limit),
    enabled: !!user,
    refetchInterval: 60_000,
  })
}

export function useUnreadNotificationCount() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['notifications_unread_count', user?.id],
    queryFn: () => fetchUnreadCount(user!.id),
    enabled: !!user,
    refetchInterval: 60_000,
  })
}

export function useMarkNotificationRead() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['notifications_unread_count', user?.id] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => markAllNotificationsRead(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['notifications_unread_count', user?.id] })
    },
  })
}
