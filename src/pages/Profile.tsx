import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export default function Profile() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profil professionnel</h1>
        <p className="text-sm text-muted-foreground">
          Vos informations, utilisées pour le matching et la génération de documents.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="full_name">Nom complet</Label>
            <Input id="full_name" placeholder="Votre nom complet" disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Localisation</Label>
            <Input id="location" placeholder="Dakar, Sénégal" disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" placeholder="+221 ..." disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input id="linkedin" placeholder="https://linkedin.com/in/..." disabled />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="summary">Résumé professionnel</Label>
            <Textarea id="summary" rows={4} placeholder="Résumé généré à partir de votre CV" disabled />
          </div>
          <div className="sm:col-span-2">
            <Button disabled>Enregistrer</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compétences</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Importez un CV depuis la page &laquo;&nbsp;Mes CV&nbsp;&raquo; pour extraire
            automatiquement vos compétences, formations et expériences.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
