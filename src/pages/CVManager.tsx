import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { FileText, Loader2, Sparkles, Star, Trash2, Upload } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CVReviewDialog } from '@/components/ai/CVReviewDialog'
import { useAnalyzeCV, useCVs, useDeleteCV, useSetPrimaryCV, useUploadCV } from '@/hooks/useCVs'
import type { Tables } from '@/types/database'
import type { CVAnalysis } from '@/types/cv'

export default function CVManager() {
  const { data: cvs, isLoading, isError } = useCVs()
  const uploadCV = useUploadCV()
  const setPrimary = useSetPrimaryCV()
  const deleteCV = useDeleteCV()
  const analyzeCV = useAnalyzeCV()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cvToDelete, setCvToDelete] = useState<Tables<'cvs'> | null>(null)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [reviewing, setReviewing] = useState<{ cvId: string; analysis: CVAnalysis } | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    uploadCV.mutate(file, {
      onSuccess: () => toast.success('CV importé'),
      onError: (error) => toast.error(error instanceof Error ? error.message : "Échec de l'import"),
    })
  }

  function handleSetPrimary(id: string) {
    setPrimary.mutate(id, {
      onSuccess: () => toast.success('CV principal mis à jour'),
      onError: () => toast.error('Impossible de mettre à jour le CV principal'),
    })
  }

  function handleDelete() {
    if (!cvToDelete) return
    deleteCV.mutate(cvToDelete, {
      onSuccess: () => {
        toast.success('CV supprimé')
        setCvToDelete(null)
      },
      onError: () => toast.error('Impossible de supprimer ce CV'),
    })
  }

  function handleAnalyze(cv: Tables<'cvs'>) {
    if (cv.parsed_data) {
      setReviewing({ cvId: cv.id, analysis: cv.parsed_data as unknown as CVAnalysis })
      return
    }
    setAnalyzingId(cv.id)
    analyzeCV.mutate(cv.id, {
      onSuccess: (analysis) => {
        toast.success('CV analysé')
        setReviewing({ cvId: cv.id, analysis })
      },
      onError: (error) => toast.error(error instanceof Error ? error.message : "Échec de l'analyse"),
      onSettled: () => setAnalyzingId(null),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mes CV</h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos différentes versions de CV (PDF, DOCX).
          </p>
        </div>
        <Button className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={uploadCV.isPending}>
          {uploadCV.isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Importer un CV
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="text-sm font-medium">Erreur de chargement</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Impossible de récupérer vos CV. Réessayez plus tard.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && cvs && cvs.length === 0 && (
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
      )}

      {!isLoading && !isError && cvs && cvs.length > 0 && (
        <div className="flex flex-col gap-3">
          {cvs.map((cv) => (
            <Card key={cv.id}>
              <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="size-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{cv.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Importé {formatDistanceToNow(new Date(cv.created_at), { addSuffix: true, locale: fr })}
                      {cv.parsed_data ? ' · analysé' : ' · non analysé'}
                    </p>
                  </div>
                  {cv.is_primary && (
                    <Badge variant="secondary" className="gap-1 shrink-0">
                      <Star className="size-3" />
                      Principal
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => handleAnalyze(cv)}
                    disabled={analyzingId === cv.id}
                  >
                    {analyzingId === cv.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="size-3.5" />
                    )}
                    {cv.parsed_data ? "Voir l'analyse" : 'Analyser'}
                  </Button>
                  {!cv.is_primary && (
                    <Button size="sm" variant="ghost" onClick={() => handleSetPrimary(cv.id)}>
                      Définir principal
                    </Button>
                  )}
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Supprimer"
                    onClick={() => setCvToDelete(cv)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!cvToDelete} onOpenChange={(open) => !open && setCvToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce CV ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {cvToDelete?.name} » sera définitivement supprimé. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CVReviewDialog
        key={reviewing?.cvId ?? 'none'}
        analysis={reviewing?.analysis ?? null}
        open={!!reviewing}
        onOpenChange={(open) => !open && setReviewing(null)}
      />
    </div>
  )
}
