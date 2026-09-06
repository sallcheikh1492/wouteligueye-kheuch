import { Link } from 'react-router-dom'
import { Building2, MapPin, CalendarDays, ExternalLink, Heart, X, Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ScoreBadge } from './ScoreBadge'
import type { JobMatchWithJob } from '@/services/jobs'

type JobCardProps = {
  match: JobMatchWithJob
  onDismiss: (matchId: string) => void
  onPrepareApplication: (jobId: string) => void
  onFavorite: (jobId: string) => void
  dismissing?: boolean
  preparing?: boolean
  favoriting?: boolean
}

export function JobCard({
  match,
  onDismiss,
  onPrepareApplication,
  onFavorite,
  dismissing,
  preparing,
  favoriting,
}: JobCardProps) {
  const { jobs: job } = match

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{job.title}</p>
            <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
              <Building2 className="size-3.5 shrink-0" />
              {job.company}
            </p>
          </div>
          <ScoreBadge score={match.overall_score} />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {job.location}
            </span>
          )}
          {job.published_at && (
            <span className="flex items-center gap-1">
              <CalendarDays className="size-3.5" />
              {formatDistanceToNow(new Date(job.published_at), { addSuffix: true, locale: fr })}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button size="sm" variant="outline" asChild>
            <Link to={`/jobs/${job.id}`}>Voir détails</Link>
          </Button>
          {job.application_url && (
            <Button size="sm" variant="ghost" asChild>
              <a href={job.application_url} target="_blank" rel="noreferrer" className="gap-1.5">
                <ExternalLink className="size-3.5" />
                Voir l&apos;offre
              </a>
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5"
            onClick={() => onPrepareApplication(job.id)}
            disabled={preparing}
          >
            <Send className="size-3.5" />
            Préparer la candidature
          </Button>
          <div className="ml-auto flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Ajouter aux favoris"
                  onClick={() => onFavorite(job.id)}
                  disabled={favoriting}
                >
                  <Heart className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ajouter aux favoris</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Ignorer"
                  onClick={() => onDismiss(match.id)}
                  disabled={dismissing}
                >
                  <X className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ignorer cette offre</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
