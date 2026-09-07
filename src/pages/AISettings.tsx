import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export default function AISettings() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agent IA</h1>
        <p className="text-sm text-muted-foreground">
          Configurez le comportement de l&apos;agent autonome de recherche d&apos;emploi.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mode de candidature</CardTitle>
          <CardDescription>
            Manuel, assisté ou automatisé (selon disponibilité technique et légale).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium">Mode assisté</p>
              <p className="text-xs text-muted-foreground">
                L&apos;agent prépare vos documents, vous validez avant envoi.
              </p>
            </div>
            <Switch disabled defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium">Candidature automatique</p>
              <p className="text-xs text-muted-foreground">
                Réservé aux offres autorisant une soumission automatisée, au-delà du score minimum.
              </p>
            </div>
            <Switch disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fournisseur IA</CardTitle>
          <CardDescription>Toutes les opérations IA s&apos;exécutent côté serveur.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <Label>Anthropic Claude</Label>
            <span className="text-xs text-muted-foreground">Configuré via secret Edge Function</span>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <Label>OpenAI (recherche web)</Label>
              <p className="text-xs text-muted-foreground">
                Activable dans Paramètres → Préférences de recherche.
              </p>
            </div>
            <span className="text-xs text-muted-foreground">Configuré via secret Edge Function</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
