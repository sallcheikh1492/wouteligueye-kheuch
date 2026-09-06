import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

export default function Settings() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground">
          Recherche, notifications et préférences générales.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fréquence de recherche</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5 sm:max-w-xs">
          <Label htmlFor="frequency">Planification</Label>
          <Select defaultValue="daily">
            <SelectTrigger id="frequency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6h">Toutes les 6 heures</SelectItem>
              <SelectItem value="12h">Toutes les 12 heures</SelectItem>
              <SelectItem value="daily">Une fois par jour</SelectItem>
              <SelectItem value="weekly">Une fois par semaine</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-app">Notifications dans l&apos;application</Label>
            <Switch id="notif-app" defaultChecked disabled />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-email">Notifications par e-mail</Label>
            <Switch id="notif-email" defaultChecked disabled />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
