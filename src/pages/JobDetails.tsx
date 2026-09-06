import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, MapPin, CalendarDays, ExternalLink, Send, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScoreBadge } from '@/components/jobs/ScoreBadge'
import { useJobMatch } from '@/hooks/useJobs'
import { useSetApplicationStatus } from '@/hooks/useApplications'

export default function JobDetails() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { data: match, isLoading, isError } = useJobMatch(jobId)
  const setStatus = useSetApplicationStatus()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    )
  }

  if (isError || !match) {
    return (
      <div className="flex flex-col gap-6">
        <Button variant="ghost" size="sm" className="w-fit gap-2" asChild>
          <Link to="/jobs">
            <ArrowLeft className="size-4" />
            Retour aux offres
          </Link>
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="text-sm font-medium">Offre introuvable</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Cette offre n&apos;existe pas ou n&apos;a pas encore été analysée pour votre profil.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { jobs: job } = match
  const missingSkills = Array.isArray(match.missing_skills) ? (match.missing_skills as string[]) : []
  const strengths = Array.isArray(match.strengths) ? (match.strengths as string[]) : []

  function handleFavorite() {
    setStatus.mutate(
      { jobId: job.id, status: 'interested' },
      {
        onSuccess: () => toast.success('Ajoutée aux favoris'),
        onError: () => toast.error("Impossible d'ajouter aux favoris"),
      },
    )
  }

  function handlePrepare() {
    setStatus.mutate(
      { jobId: job.id, status: 'reviewing' },
      {
        onSuccess: () => {
          toast.success('Candidature en préparation')
          navigate('/applications')
        },
        onError: () => toast.error('Impossible de préparer la candidature'),
      },
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit gap-2" asChild>
        <Link to="/jobs">
          <ArrowLeft className="size-4" />
          Retour aux offres
        </Link>
      </Button>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold">{job.title}</h1>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="size-4" />
                {job.company}
              </p>
            </div>
            <ScoreBadge score={match.overall_score} className="text-sm" />
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {job.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" />
                {job.location}
              </span>
            )}
            {job.published_at && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4" />
                Publiée le {format(new Date(job.published_at), 'd MMMM yyyy', { locale: fr })}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {job.application_url && (
              <Button asChild className="gap-2">
                <a href={job.application_url} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" />
                  Voir l&apos;offre originale
                </a>
              </Button>
            )}
            <Button variant="outline" className="gap-2" onClick={handlePrepare} disabled={setStatus.isPending}>
              <Send className="size-4" />
              Préparer la candidature
            </Button>
            <Button variant="ghost" className="gap-2" onClick={handleFavorite} disabled={setStatus.isPending}>
              <Heart className="size-4" />
              Ajouter aux favoris
            </Button>
          </div>

          <Separator />

          {(strengths.length > 0 || missingSkills.length > 0) && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {strengths.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">Points forts</p>
                  <div className="flex flex-wrap gap-1.5">
                    {strengths.map((s) => (
                      <Badge key={s} variant="secondary">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {missingSkills.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">Compétences manquantes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {missingSkills.map((s) => (
                      <Badge key={s} variant="outline">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {match.recommendation && (
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
              {match.recommendation}
            </div>
          )}

          {job.description && (
            <div>
              <p className="mb-2 text-sm font-medium">Description</p>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{job.description}</p>
            </div>
          )}

          {job.requirements && (
            <div>
              <p className="mb-2 text-sm font-medium">Exigences</p>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{job.requirements}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
