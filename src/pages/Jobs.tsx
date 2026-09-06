import { useState } from 'react'
import { Search, SlidersHorizontal, LayoutGrid, List } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function Jobs() {
  const [view, setView] = useState<'grid' | 'table'>('grid')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Offres d&apos;emploi</h1>
          <p className="text-sm text-muted-foreground">
            Offres découvertes et analysées par votre agent IA.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setView('grid')}
            aria-label="Vue cartes"
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={view === 'table' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setView('table')}
            aria-label="Vue tableau"
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher un poste, une entreprise..." className="pl-9" />
        </div>
        <Button variant="outline" className="gap-2">
          <SlidersHorizontal className="size-4" />
          Filtres
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <p className="text-sm font-medium">Aucune offre pour le moment</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Lancez une recherche manuelle ou activez la planification automatique dans les
            Paramètres pour que l&apos;agent commence à découvrir des offres correspondant à
            votre profil.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
