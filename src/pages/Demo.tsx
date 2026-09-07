import { Link } from 'react-router-dom'
import { Bot, Briefcase, FileText, Flame, Sparkles, TrendingUp, Moon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScoreBadge } from '@/components/jobs/ScoreBadge'

// Static, fictional data only — this page never calls Supabase. It exists so
// someone can see what the product looks like before creating an account,
// without us ever using a real (or shared) account's real data to do it.
const STATS = [
  { label: "Offres trouvées aujourd'hui", value: 12, icon: Briefcase },
  { label: 'Offres analysées', value: 47, icon: Sparkles },
  { label: 'Meilleures opportunités', value: 5, icon: Flame },
  { label: 'Candidatures envoyées', value: 9, icon: FileText },
  { label: 'Entretiens', value: 2, icon: TrendingUp },
  { label: 'Taux de réponse', value: '22%', icon: TrendingUp },
] as const

const TOP_MATCHES = [
  { title: 'Business Intelligence Analyst', company: 'Sonatel', score: 92 },
  { title: 'Data Analyst', company: 'Orange Sénégal', score: 87 },
  { title: 'Analyste BI Junior', company: 'Wave', score: 81 },
]

const RECENT_JOBS = [
  { title: 'Reporting Analyst', company: 'Free Sénégal', score: 74 },
  { title: 'Data Engineer Junior', company: 'Chargeurs', score: 68 },
]

const RECENT_APPLICATIONS = [
  { title: 'Data Analyst', company: 'Orange Sénégal', status: 'Entretien' },
  { title: 'Business Analyst', company: 'CBAO', status: 'Envoyée' },
]

export default function Demo() {
  return (
    <div className="min-h-svh bg-background">
      <div className="flex flex-col items-start gap-3 border-b border-border bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Bot className="size-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold">Mode démo — données fictives</p>
            <p className="text-xs text-muted-foreground">
              Rien ici n&apos;est réel ou enregistré. Créez un compte pour votre vraie recherche.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/login">Se connecter</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/signup">Créer un compte</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
            <p className="text-sm text-muted-foreground">
              Vue d&apos;ensemble de votre recherche d&apos;emploi assistée par IA.
            </p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Mode sombre (désactivé en démo)" disabled>
            <Moon className="size-4" />
          </Button>
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
              <ul className="flex flex-col gap-3">
                {TOP_MATCHES.map((job) => (
                  <li
                    key={job.title}
                    className="flex items-center justify-between gap-2 rounded-md border border-border p-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{job.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{job.company}</p>
                    </div>
                    <ScoreBadge score={job.score} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="size-4 text-blue-500" /> Nouvelles offres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {RECENT_JOBS.map((job) => (
                  <li
                    key={job.title}
                    className="flex items-center justify-between gap-2 rounded-md border border-border p-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{job.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{job.company}</p>
                    </div>
                    <ScoreBadge score={job.score} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4 text-emerald-500" /> Candidatures récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {RECENT_APPLICATIONS.map((app) => (
                  <li
                    key={app.title}
                    className="flex items-center justify-between gap-2 rounded-md border border-border p-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{app.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{app.company}</p>
                    </div>
                    <Badge variant="outline">{app.status}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="size-4 text-purple-500" /> Activité récente de l&apos;agent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">scheduled_job_search</span>
                  <Badge variant="outline">completed</Badge>
                </div>
                <p className="text-xs text-muted-foreground">il y a 3 heures · 3 offre(s) correspondante(s)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-8 text-center">
          <p className="font-medium">Prêt à lancer votre propre recherche ?</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Importez votre CV, définissez vos préférences, et laissez l&apos;agent IA découvrir et
            scorer des offres réelles pour vous.
          </p>
          <Button asChild>
            <Link to="/signup">Créer mon compte gratuitement</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
