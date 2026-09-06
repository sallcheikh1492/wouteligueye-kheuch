import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { JobCard } from '@/components/jobs/JobCard'
import { useDismissJobMatch, useMatchedJobs } from '@/hooks/useJobs'
import { useSetApplicationStatus } from '@/hooks/useApplications'

const MIN_SCORE_OPTIONS = [
  { value: '0', label: 'Tous les scores' },
  { value: '40', label: '40+ (à examiner et plus)' },
  { value: '60', label: '60+ (intéressant et plus)' },
  { value: '75', label: '75+ (très bon et plus)' },
  { value: '90', label: '90+ (excellent uniquement)' },
]

export default function Jobs() {
  const [search, setSearch] = useState('')
  const [minScore, setMinScore] = useState('0')
  const navigate = useNavigate()

  const filters = useMemo(
    () => ({ search: search || undefined, minScore: minScore !== '0' ? Number(minScore) : undefined }),
    [search, minScore],
  )

  const { data: matches, isLoading, isError } = useMatchedJobs(filters)
  const dismissMatch = useDismissJobMatch()
  const setStatus = useSetApplicationStatus()

  function handleDismiss(matchId: string) {
    dismissMatch.mutate(matchId, {
      onSuccess: () => toast.success('Offre ignorée'),
      onError: () => toast.error("Impossible d'ignorer cette offre"),
    })
  }

  function handleFavorite(jobId: string) {
    setStatus.mutate(
      { jobId, status: 'interested' },
      {
        onSuccess: () => toast.success('Ajoutée aux favoris'),
        onError: () => toast.error("Impossible d'ajouter aux favoris"),
      },
    )
  }

  function handlePrepare(jobId: string) {
    setStatus.mutate(
      { jobId, status: 'reviewing' },
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Offres d&apos;emploi</h1>
        <p className="text-sm text-muted-foreground">
          Offres découvertes et analysées par votre agent IA.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un poste, une entreprise..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={minScore} onValueChange={setMinScore}>
          <SelectTrigger className="w-full sm:w-64">
            <SlidersHorizontal className="size-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MIN_SCORE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="text-sm font-medium">Erreur de chargement</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Impossible de récupérer vos offres. Vérifiez votre connexion et réessayez.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && matches && matches.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="text-sm font-medium">Aucune offre pour le moment</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Lancez une recherche manuelle ou activez la planification automatique dans les
              Paramètres pour que l&apos;agent commence à découvrir des offres correspondant à
              votre profil.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && matches && matches.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => (
            <JobCard
              key={match.id}
              match={match}
              onDismiss={handleDismiss}
              onFavorite={handleFavorite}
              onPrepareApplication={handlePrepare}
              dismissing={dismissMatch.isPending}
              favoriting={setStatus.isPending}
              preparing={setStatus.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
