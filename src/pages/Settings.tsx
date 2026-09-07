import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Plus, RadioTower, Search } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useJobPreferences, useUpdateJobPreferences } from '@/hooks/useJobPreferences'
import { useAddJobSource, useDiscoverJobs, useJobSources } from '@/hooks/useJobSources'
import { JobPreferencesCard } from '@/components/settings/JobPreferencesCard'
import type { SearchFrequency } from '@/types/database'

const FREQUENCY_LABELS: Record<SearchFrequency, string> = {
  every_6_hours: 'Toutes les 6 heures',
  every_12_hours: 'Toutes les 12 heures',
  daily: 'Une fois par jour',
  weekly: 'Une fois par semaine',
}

function SearchFrequencyCard() {
  const { data: prefs, isLoading } = useJobPreferences()
  const updatePrefs = useUpdateJobPreferences()

  function handleChange(value: SearchFrequency) {
    updatePrefs.mutate(
      { search_frequency: value },
      {
        onSuccess: () => toast.success('Fréquence mise à jour'),
        onError: () => toast.error('Impossible de mettre à jour la fréquence'),
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Fréquence de recherche</CardTitle>
        <CardDescription>
          Utilisée par la recherche automatique planifiée une fois activée (étape suivante :
          planification et automatisation).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5 sm:max-w-xs">
        <Label htmlFor="frequency">Planification</Label>
        {isLoading ? (
          <Skeleton className="h-9 w-full" />
        ) : (
          <Select value={prefs?.search_frequency ?? 'daily'} onValueChange={handleChange}>
            <SelectTrigger id="frequency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardContent>
    </Card>
  )
}

function SourcesCard() {
  const { data: sources, isLoading } = useJobSources()
  const addSource = useAddJobSource()
  const discover = useDiscoverJobs()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')

  function handleAdd() {
    if (!name.trim() || !url.trim()) return
    addSource.mutate(
      { name: name.trim(), url: url.trim(), is_active: true, api_available: false },
      {
        onSuccess: () => {
          setName('')
          setUrl('')
          toast.success('Source ajoutée')
        },
        onError: () => toast.error("Impossible d'ajouter cette source"),
      },
    )
  }

  function handleDiscover() {
    discover.mutate(undefined, {
      onSuccess: (result) =>
        toast.success(
          `${result.jobs_processed} nouvelle(s) offre(s) importée(s), ${result.jobs_matched} analysée(s)`,
        ),
      onError: (error) => toast.error(error instanceof Error ? error.message : 'Échec de la recherche'),
    })
  }

  const rssSources = (sources ?? []).filter((s) => s.type === 'rss_feed')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sources de recherche</CardTitle>
        <CardDescription>
          Ajoutez un flux RSS public (offres d&apos;emploi) pour que l&apos;agent y découvre de
          nouvelles offres. Seuls des flux publiés publiquement pour la syndication sont utilisés —
          aucun contournement de protection ou de CAPTCHA.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input placeholder="Nom de la source" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            placeholder="https://.../feed.rss"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button onClick={handleAdd} disabled={addSource.isPending} className="gap-1.5 sm:w-auto">
            <Plus className="size-3.5" />
            Ajouter
          </Button>
        </div>

        {isLoading ? (
          <Skeleton className="h-16 rounded-lg" />
        ) : rssSources.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun flux RSS configuré pour le moment.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {rssSources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border p-2.5 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <RadioTower className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium">{source.name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {source.last_checked_at && (
                    <span className="text-xs text-muted-foreground">
                      Vérifiée{' '}
                      {formatDistanceToNow(new Date(source.last_checked_at), { addSuffix: true, locale: fr })}
                    </span>
                  )}
                  <Badge variant={source.is_active ? 'secondary' : 'outline'}>
                    {source.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          className="w-fit gap-1.5"
          onClick={handleDiscover}
          disabled={discover.isPending || rssSources.length === 0}
        >
          {discover.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
          Lancer une recherche maintenant
        </Button>
      </CardContent>
    </Card>
  )
}

export default function Settings() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground">
          Recherche, notifications et préférences générales.
        </p>
      </div>

      <JobPreferencesCard />
      <SearchFrequencyCard />
      <SourcesCard />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
          <CardDescription>
            Les notifications dans l&apos;application (cloche en haut à droite) sont actives dès
            qu&apos;une offre correspond à 80 % ou plus. L&apos;envoi par e-mail n&apos;est pas
            encore disponible.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-app">Notifications dans l&apos;application</Label>
            <Switch id="notif-app" defaultChecked disabled />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-email">Notifications par e-mail</Label>
            <Switch id="notif-email" disabled />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
