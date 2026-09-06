import { Link } from 'react-router-dom'
import { Briefcase, FileText, Flame, TrendingUp, Sparkles, Bot, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScoreBadge } from '@/components/jobs/ScoreBadge'
import {
  useDashboardStats,
  useRecentAgentRuns,
  useRecentApplications,
  useRecentMatches,
  useTopMatches,
} from '@/hooks/useDashboard'

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading, isError: statsError } = useDashboardStats()
  const { data: topMatches, isLoading: topLoading, isError: topError } = useTopMatches(5)
  const { data: recentMatches, isLoading: recentLoading, isError: recentError } = useRecentMatches(5)
  const {
    data: recentApplications,
    isLoading: applicationsLoading,
    isError: applicationsError,
  } = useRecentApplications(5)
  const { data: recentRuns, isLoading: runsLoading, isError: runsError } = useRecentAgentRuns(5)

  const hasError = statsError || topError || recentError || applicationsError || runsError

  const STAT_ITEMS = [
    { label: "Offres trouvées aujourd'hui", value: stats?.jobsFoundToday ?? 0, icon: Briefcase },
    { label: 'Offres analysées', value: stats?.jobsAnalyzed ?? 0, icon: Sparkles },
    { label: 'Meilleures opportunités', value: stats?.bestOpportunities ?? 0, icon: Flame },
    { label: 'Candidatures envoyées', value: stats?.applicationsSent ?? 0, icon: FileText },
    { label: 'Entretiens', value: stats?.interviews ?? 0, icon: TrendingUp },
    { label: 'Taux de réponse', value: `${stats?.responseRate ?? 0}%`, icon: TrendingUp },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">
          Vue d&apos;ensemble de votre recherche d&apos;emploi assistée par IA.
        </p>
      </div>

      {hasError && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Erreur de chargement</AlertTitle>
          <AlertDescription>
            Certaines données du tableau de bord n&apos;ont pas pu être récupérées. Vérifiez votre
            connexion et réessayez.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {STAT_ITEMS.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex flex-col gap-2 pt-6">
              <Icon className="size-4 text-muted-foreground" />
              {statsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <span className="text-2xl font-semibold">{value}</span>
              )}
              <span className="text-xs text-muted-foreground">{label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="size-4 text-orange-500" /> Meilleures opportunités
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topLoading ? (
              <Skeleton className="h-32 rounded-lg" />
            ) : topMatches && topMatches.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {topMatches.map((match) => (
                  <li key={match.id}>
                    <Link
                      to={`/jobs/${match.job_id}`}
                      className="flex items-center justify-between gap-2 rounded-md border border-border p-2.5 hover:bg-accent"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{match.jobs.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{match.jobs.company}</p>
                      </div>
                      <ScoreBadge score={match.overall_score} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Aucune opportunité pour le moment"
                description="Configurez votre profil et vos préférences pour que l'agent IA commence à détecter des offres correspondantes."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-blue-500" /> Nouvelles offres
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentLoading ? (
              <Skeleton className="h-32 rounded-lg" />
            ) : recentMatches && recentMatches.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {recentMatches.map((match) => (
                  <li key={match.id}>
                    <Link
                      to={`/jobs/${match.job_id}`}
                      className="flex items-center justify-between gap-2 rounded-md border border-border p-2.5 hover:bg-accent"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{match.jobs.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{match.jobs.company}</p>
                      </div>
                      <ScoreBadge score={match.overall_score} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Aucune nouvelle offre"
                description="Les nouvelles offres détectées par l'agent apparaîtront ici."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-emerald-500" /> Candidatures récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {applicationsLoading ? (
              <Skeleton className="h-32 rounded-lg" />
            ) : recentApplications && recentApplications.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {recentApplications.map((application) => (
                  <li key={application.id}>
                    <Link
                      to={`/jobs/${application.job_id}`}
                      className="flex items-center justify-between gap-2 rounded-md border border-border p-2.5 hover:bg-accent"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{application.jobs.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{application.jobs.company}</p>
                      </div>
                      <Badge variant="outline">{application.status}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Aucune candidature envoyée"
                description="Vos candidatures récentes et leur statut s'afficheront ici."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="size-4 text-purple-500" /> Activité récente de l&apos;agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {runsLoading ? (
              <Skeleton className="h-32 rounded-lg" />
            ) : recentRuns && recentRuns.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {recentRuns.map((run) => (
                  <li key={run.id} className="rounded-md border border-border p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{run.agent_type}</span>
                      <Badge variant={run.status === 'failed' ? 'destructive' : 'outline'}>
                        {run.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(run.started_at), { addSuffix: true, locale: fr })} ·{' '}
                      {run.jobs_matched} offre(s) correspondante(s)
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="Aucune exécution de l'agent"
                description="L'historique des recherches automatiques s'affichera ici une fois l'agent activé."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
