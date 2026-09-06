import { Upload, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function CVManager() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mes CV</h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos différentes versions de CV (PDF, DOCX).
          </p>
        </div>
        <Button className="gap-2">
          <Upload className="size-4" />
          Importer un CV
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <FileText className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">Aucun CV importé</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Importez votre CV pour que l&apos;IA extraie automatiquement vos compétences,
            expériences, formations et certifications.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
