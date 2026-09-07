import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KanbanBoard } from '@/components/applications/KanbanBoard'
import { useApplications, useUpdateApplication } from '@/hooks/useApplications'
import type { ApplicationStatus } from '@/types/database'

const STATUSES: { value: ApplicationStatus; label: string }[] = [
  { value: 'discovered', label: 'Découverte' },
  { value: 'reviewing', label: 'En cours de préparation' },
  { value: 'interested', label: 'Intéressé' },
  { value: 'documents_ready', label: 'Documents prêts' },
  { value: 'ready_to_apply', label: 'Prête à envoyer' },
  { value: 'submitted', label: 'Envoyée' },
  { value: 'interview', label: 'Entretien' },
  { value: 'rejected', label: 'Refusée' },
  { value: 'accepted', label: 'Acceptée' },
  { value: 'withdrawn', label: 'Retirée' },
  { value: 'no_response', label: 'Sans réponse' },
]

const STATUS_LABEL: Record<ApplicationStatus, string> = Object.fromEntries(
  STATUSES.map((s) => [s.value, s.label]),
) as Record<ApplicationStatus, string>

export default function Applications() {
  const { data: applications, isLoading, isError } = useApplications()
  const updateApplication = useUpdateApplication()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [view, setView] = useState<'kanban' | 'list'>('kanban')

  const filtered = useMemo(() => {
    if (!applications) return []
    if (statusFilter === 'all') return applications
    return applications.filter((a) => a.status === statusFilter)
  }, [applications, statusFilter])

  function handleStatusChange(id: string, status: ApplicationStatus) {
    updateApplication.mutate(
      { id, patch: { status } },
      {
        onSuccess: () => toast.success('Statut mis à jour'),
        onError: () => toast.error('Impossible de mettre à jour le statut'),
      },
    )
  }

  const isEmpty = !isLoading && !isError && (applications?.length ?? 0) === 0

  return (
    <Tabs value={view} onValueChange={(v) => setView(v as 'kanban' | 'list')} className="gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Candidatures</h1>
          <p className="text-sm text-muted-foreground">
            Suivez l&apos;évolution de toutes vos candidatures.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="list">Liste</TabsTrigger>
          </TabsList>
          {view === 'list' && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="text-sm font-medium">Erreur de chargement</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Impossible de récupérer vos candidatures. Réessayez plus tard.
            </p>
          </CardContent>
        </Card>
      )}

      {isEmpty && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="text-sm font-medium">Aucune candidature</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Vos candidatures apparaîtront ici dès que vous en préparerez une depuis une offre.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && !isEmpty && (
        <>
          <TabsContent value="kanban">
            <KanbanBoard applications={applications ?? []} />
          </TabsContent>

          <TabsContent value="list">
            {filtered.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <p className="text-sm font-medium">Aucune candidature pour ce statut</p>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map((application) => (
                  <Card key={application.id}>
                    <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <Link to={`/jobs/${application.job_id}`} className="font-medium hover:underline">
                          {application.jobs.title}
                        </Link>
                        <p className="text-sm text-muted-foreground">{application.jobs.company}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="hidden sm:inline-flex">
                          {STATUS_LABEL[application.status]}
                        </Badge>
                        <Select
                          value={application.status}
                          onValueChange={(value) => handleStatusChange(application.id, value as ApplicationStatus)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </>
      )}
    </Tabs>
  )
}
