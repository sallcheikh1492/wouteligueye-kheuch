import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function JobDetails() {
  const { jobId } = useParams()

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit gap-2" asChild>
        <Link to="/jobs">
          <ArrowLeft className="size-4" />
          Retour aux offres
        </Link>
      </Button>

      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <p className="text-sm font-medium">Offre introuvable</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Aucune donnée disponible pour l&apos;offre {jobId}. Cette page affichera les
            détails complets, le score de compatibilité et les actions de candidature une fois
            les offres synchronisées.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
