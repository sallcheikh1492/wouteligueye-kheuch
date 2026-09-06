import { Bot } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export default function Signup() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Bot className="mb-2 size-8 text-primary" />
          <CardTitle>Créer un compte</CardTitle>
          <CardDescription>Démarrez votre recherche d&apos;emploi assistée par IA</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="full_name">Nom complet</Label>
            <Input id="full_name" placeholder="Votre nom" disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" placeholder="vous@exemple.com" disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" placeholder="••••••••" disabled />
          </div>
          <Button disabled>Créer mon compte</Button>
          <p className="text-center text-xs text-muted-foreground">
            L&apos;authentification sera activée dans la prochaine étape.{' '}
            <Link to="/login" className="underline">
              Déjà un compte ?
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
