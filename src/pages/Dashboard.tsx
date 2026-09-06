import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase, FileText, Flame, TrendingUp, Sparkles, Bot } from 'lucide-react'

const STATS = [
  { label: "Offres trouvées aujourd'hui", value: 0, icon: Briefcase },
  { label: 'Offres analysées', value: 0, icon: Sparkles },
  { label: 'Meilleures opportunités', value: 0, icon: Flame },
  { label: 'Candidatures envoyées', value: 0, icon: FileText },
  { label: 'Entretiens', value: 0, icon: TrendingUp },
  { label: 'Taux de réponse', value: '0%', icon: TrendingUp },
] as const

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export default function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">
          Vue d&apos;ensemble de votre recherche d&apos;emploi assistée par IA.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {STATS.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex flex-col gap-2 pt-6">
              <Icon className="size-4 text-muted-foreground" />
              <span className="text-2xl font-semibold">{value}</span>
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
            <EmptyState
              title="Aucune opportunité pour le moment"
              description="Configurez votre profil et vos préférences pour que l'agent IA commence à détecter des offres correspondantes."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-blue-500" /> Nouvelles offres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="Aucune nouvelle offre"
              description="Les nouvelles offres détectées par l'agent apparaîtront ici."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-emerald-500" /> Candidatures récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="Aucune candidature envoyée"
              description="Vos candidatures récentes et leur statut s'afficheront ici."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="size-4 text-purple-500" /> Activité récente de l&apos;agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="Aucune exécution de l'agent"
              description="L'historique des recherches automatiques s'affichera ici une fois l'agent activé."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
