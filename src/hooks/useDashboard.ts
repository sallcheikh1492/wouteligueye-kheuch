import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { fetchDashboardStats } from '@/services/dashboard'
import { fetchRecentApplications } from '@/services/applications'
import { fetchRecentMatches, fetchTopMatches } from '@/services/jobs'
import { fetchRecentAgentRuns } from '@/services/agentRuns'

export function useDashboardStats() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['dashboard_stats', user?.id],
    queryFn: () => fetchDashboardStats(user!.id),
    enabled: !!user,
  })
}

export function useTopMatches(limit = 5) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['top_matches', user?.id, limit],
    queryFn: () => fetchTopMatches(user!.id, limit),
    enabled: !!user,
  })
}

export function useRecentMatches(limit = 5) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['recent_matches', user?.id, limit],
    queryFn: () => fetchRecentMatches(user!.id, limit),
    enabled: !!user,
  })
}

export function useRecentApplications(limit = 5) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['recent_applications', user?.id, limit],
    queryFn: () => fetchRecentApplications(user!.id, limit),
    enabled: !!user,
  })
}

export function useRecentAgentRuns(limit = 5) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['recent_agent_runs', user?.id, limit],
    queryFn: () => fetchRecentAgentRuns(user!.id, limit),
    enabled: !!user,
  })
}
