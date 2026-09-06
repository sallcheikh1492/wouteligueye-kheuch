import { supabase } from '@/integrations/supabase/client'
import { RESPONDED_STATUSES, SENT_STATUSES } from './applications'

export type DashboardStats = {
  jobsFoundToday: number
  jobsAnalyzed: number
  bestOpportunities: number
  applicationsSent: number
  interviews: number
  responseRate: number
}

export async function fetchDashboardStats(userId: string): Promise<DashboardStats> {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const results = await Promise.all([
    supabase
      .from('job_matches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfToday.toISOString()),
    supabase.from('job_matches').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase
      .from('job_matches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('overall_score', 75),
    supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', SENT_STATUSES),
    supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'interview'),
    supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', RESPONDED_STATUSES),
  ])

  for (const result of results) {
    if (result.error) throw result.error
  }

  const [jobsFoundToday, jobsAnalyzed, bestOpportunities, applicationsSent, interviews, responded] =
    results.map((result) => result.count ?? 0)

  const responseRate = applicationsSent > 0 ? Math.round((responded / applicationsSent) * 100) : 0

  return { jobsFoundToday, jobsAnalyzed, bestOpportunities, applicationsSent, interviews, responseRate }
}
