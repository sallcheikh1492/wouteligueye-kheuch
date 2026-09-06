import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl font-semibold">404</h1>
      <p className="text-muted-foreground">Cette page n&apos;existe pas.</p>
      <Button asChild>
        <Link to="/">Retour au tableau de bord</Link>
      </Button>
    </div>
  )
}
