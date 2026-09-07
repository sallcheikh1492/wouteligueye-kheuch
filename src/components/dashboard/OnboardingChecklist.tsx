import { Link } from 'react-router-dom'
import { Check, FileText, Search, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCVs } from '@/hooks/useCVs'
import { useJobPreferences } from '@/hooks/useJobPreferences'
import { useRecentAgentRuns } from '@/hooks/useDashboard'

type Step = {
  key: string
  title: string
  description: string
  done: boolean
  cta: string
  to: string
  icon: typeof FileText
}

export function OnboardingChecklist() {
  const { data: cvs } = useCVs()
  const { data: prefs } = useJobPreferences()
  const { data: runs } = useRecentAgentRuns(1)

  const hasAnalyzedCV = (cvs ?? []).some((cv) => !!cv.parsed_data)
  const desiredTitles = Array.isArray(prefs?.desired_titles) ? prefs.desired_titles : []
  const hasPreferences = desiredTitles.length > 0
  const hasRunSearch = (runs ?? []).length > 0

  const steps: Step[] = [
    {
      key: 'cv',
      title: 'Importer et analyser votre CV',
      description: "L'IA en extrait vos compétences, formations et expériences.",
      done: hasAnalyzedCV,
      cta: 'Importer un CV',
      to: '/cv-manager',
      icon: FileText,
    },
    {
      key: 'preferences',
      title: 'Configurer vos préférences de recherche',
      description: 'Postes recherchés, localisations et mots-clés pour cibler les bonnes offres.',
      done: hasPreferences,
      cta: 'Configurer',
      to: '/settings',
      icon: Sparkles,
    },
    {
      key: 'search',
      title: 'Lancer votre première recherche',
      description: "L'agent découvre des offres et calcule votre score de compatibilité.",
      done: hasRunSearch,
      cta: 'Lancer une recherche',
      to: '/settings',
      icon: Search,
    },
  ]

  const remaining = steps.filter((s) => !s.done)
  if (remaining.length === 0) return null

  return (
    <Card className="border-primary/30 bg-primary/[0.03]">
      <CardHeader>
        <CardTitle className="text-base">Bienvenue — démarrez en 3 étapes</CardTitle>
        <CardDescription>
          {steps.length - remaining.length}/{steps.length} étapes terminées
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {steps.map((step) => (
          <div
            key={step.key}
            className={`flex items-center justify-between gap-3 rounded-md border p-3 ${
              step.done ? 'border-border bg-muted/30' : 'border-border'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                  step.done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {step.done ? <Check className="size-4" /> : <step.icon className="size-4" />}
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-medium ${step.done ? 'text-muted-foreground line-through' : ''}`}>
                  {step.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
            {!step.done && (
              <Button size="sm" variant="outline" className="shrink-0" asChild>
                <Link to={step.to}>{step.cta}</Link>
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
