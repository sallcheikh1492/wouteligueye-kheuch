import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const STATUSES = [
  'discovered',
  'reviewing',
  'interested',
  'documents_ready',
  'ready_to_apply',
  'submitted',
  'interview',
  'rejected',
  'accepted',
  'withdrawn',
  'no_response',
] as const

export default function Applications() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Candidatures</h1>
        <p className="text-sm text-muted-foreground">
          Suivez l&apos;évolution de toutes vos candidatures.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((status) => (
          <Badge key={status} variant="outline" className="font-normal">
            {status}
          </Badge>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <p className="text-sm font-medium">Aucune candidature</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Vos candidatures apparaîtront ici dès que vous en préparerez une depuis une offre.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
