import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TagInput } from './TagInput'
import { useJobPreferences, useUpdateJobPreferences } from '@/hooks/useJobPreferences'
import type { RemotePreference } from '@/types/database'

const REMOTE_LABELS: Record<RemotePreference, string> = {
  onsite: 'Sur site uniquement',
  hybrid: 'Hybride',
  remote: 'Télétravail uniquement',
  any: 'Indifférent',
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

export function JobPreferencesCard() {
  const { data: prefs, isLoading } = useJobPreferences()
  const updatePrefs = useUpdateJobPreferences()

  const [desiredTitles, setDesiredTitles] = useState<string[] | null>(null)
  const [preferredLocations, setPreferredLocations] = useState<string[] | null>(null)
  const [keywords, setKeywords] = useState<string[] | null>(null)
  const [remotePreference, setRemotePreference] = useState<RemotePreference | null>(null)
  const [minimumMatchScore, setMinimumMatchScore] = useState<number | null>(null)
  const [webSearchEnabled, setWebSearchEnabled] = useState<boolean | null>(null)

  // Local state is seeded lazily from the fetched row, then edited freely —
  // recomputing from `prefs` on every render would stomp on in-progress edits.
  const titles = desiredTitles ?? asStringArray(prefs?.desired_titles) ?? []
  const locations = preferredLocations ?? asStringArray(prefs?.preferred_locations) ?? []
  const kw = keywords ?? asStringArray(prefs?.keywords) ?? []
  const remote = remotePreference ?? prefs?.remote_preference ?? 'any'
  const minScore = minimumMatchScore ?? prefs?.minimum_match_score ?? 60
  const webSearch = webSearchEnabled ?? prefs?.web_search_enabled ?? false

  function handleSave() {
    updatePrefs.mutate(
      {
        desired_titles: titles,
        preferred_locations: locations,
        keywords: kw,
        remote_preference: remote,
        minimum_match_score: minScore,
        web_search_enabled: webSearch,
      },
      {
        onSuccess: () => toast.success('Préférences enregistrées'),
        onError: () => toast.error("Impossible d'enregistrer les préférences"),
      },
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-64 rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Préférences de recherche</CardTitle>
        <CardDescription>
          Utilisées par l&apos;agent pour filtrer et prioriser les offres découvertes.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Postes recherchés</Label>
            <TagInput value={titles} onChange={setDesiredTitles} placeholder="Ex : Data Analyst (Entrée pour ajouter)" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Localisations préférées</Label>
            <TagInput value={locations} onChange={setPreferredLocations} placeholder="Ex : Dakar, Télétravail" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Mots-clés</Label>
          <TagInput value={kw} onChange={setKeywords} placeholder="Ex : SQL, Power BI" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="remote-pref">Préférence télétravail</Label>
            <Select value={remote} onValueChange={(v) => setRemotePreference(v as RemotePreference)}>
              <SelectTrigger id="remote-pref">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REMOTE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="min-score">Score minimum pour apparaître dans vos offres</Label>
            <Input
              id="min-score"
              type="number"
              min={0}
              max={100}
              value={minScore}
              onChange={(e) => setMinimumMatchScore(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <p className="text-sm font-medium">Recherche web via IA (OpenAI)</p>
            <p className="text-xs text-muted-foreground">
              En plus de vos flux RSS, demande à l&apos;IA de chercher sur le web des offres
              réelles correspondant à vos postes recherchés. Nécessite une clé OpenAI configurée
              côté serveur.
            </p>
          </div>
          <Switch checked={webSearch} onCheckedChange={setWebSearchEnabled} />
        </div>

        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <p className="text-sm font-medium">Candidature automatique</p>
            <p className="text-xs text-muted-foreground">
              Bientôt disponible — nécessite une validation légale et technique supplémentaire
              (spec section 16, mode automatisé).
            </p>
          </div>
          <Switch checked={prefs?.auto_apply_enabled ?? false} disabled />
        </div>

        <Button onClick={handleSave} disabled={updatePrefs.isPending} className="w-fit gap-2">
          {updatePrefs.isPending && <Loader2 className="size-4 animate-spin" />}
          <Save className="size-4" />
          Enregistrer les préférences
        </Button>
      </CardContent>
    </Card>
  )
}
