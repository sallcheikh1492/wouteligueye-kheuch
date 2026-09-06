import { useState } from 'react'
import { toast } from 'sonner'
import { Download, FileText, Loader2, Mail, RefreshCw, Save, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useGenerateCoverLetter, useJobDocuments, useOptimizeCV, useUpdateDocument } from '@/hooks/useDocuments'
import { downloadTextFile } from '@/lib/download'
import type { CVExperience, CoverLetterTone } from '@/types/cv'

const TONE_LABELS: Record<CoverLetterTone, string> = {
  formal: 'Formel',
  enthusiastic: 'Enthousiaste',
  concise: 'Concis',
}

function CoverLetterCard({
  jobId,
  company,
  content,
}: {
  jobId: string
  company: string
  content: string | null
}) {
  const [tone, setTone] = useState<CoverLetterTone>('formal')
  const [draft, setDraft] = useState(content ?? '')
  const generate = useGenerateCoverLetter(jobId)
  const update = useUpdateDocument(jobId)

  function handleGenerate() {
    generate.mutate(tone, {
      onSuccess: (result) => {
        setDraft(result.content)
        toast.success('Lettre de motivation générée')
      },
      onError: (error) => toast.error(error instanceof Error ? error.message : 'Échec de la génération'),
    })
  }

  function handleSave(documentId: string) {
    update.mutate(
      { id: documentId, patch: { content: draft } },
      {
        onSuccess: () => toast.success('Modifications enregistrées'),
        onError: () => toast.error("Impossible d'enregistrer les modifications"),
      },
    )
  }

  const latestId = generate.data?.document.id

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="size-4 text-primary" />
          Lettre de motivation
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={tone} onValueChange={(v) => setTone(v as CoverLetterTone)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TONE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="gap-1.5" onClick={handleGenerate} disabled={generate.isPending}>
            {generate.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : draft ? (
              <RefreshCw className="size-3.5" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            {draft ? 'Régénérer' : 'Générer'}
          </Button>
        </div>

        {draft && (
          <>
            <Textarea rows={10} value={draft} onChange={(e) => setDraft(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              {latestId && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => handleSave(latestId)}
                  disabled={update.isPending}
                >
                  <Save className="size-3.5" />
                  Enregistrer
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5"
                onClick={() => downloadTextFile(`lettre-motivation-${company}.txt`, draft)}
              >
                <Download className="size-3.5" />
                Télécharger
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function OptimizedCVCard({ jobId, company }: { jobId: string; company: string }) {
  const optimize = useOptimizeCV(jobId)
  const result = optimize.data?.optimized

  function handleOptimize() {
    optimize.mutate(undefined, {
      onSuccess: () => toast.success('CV optimisé pour cette offre'),
      onError: (error) => toast.error(error instanceof Error ? error.message : "Échec de l'optimisation"),
    })
  }

  function handleDownload() {
    if (!result) return
    const lines = [
      result.summary,
      '',
      'Compétences mises en avant :',
      result.highlighted_skills.join(', '),
      '',
      'Expériences :',
      ...result.reordered_experience.map(
        (exp: CVExperience) =>
          `- ${exp.title} · ${exp.company} (${exp.start_date ?? ''} — ${exp.end_date ?? 'présent'})\n  ${exp.description ?? ''}`,
      ),
    ]
    downloadTextFile(`cv-optimise-${company}.txt`, lines.join('\n'))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="size-4 text-primary" />
          CV optimisé pour cette offre
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button size="sm" className="w-fit gap-1.5" onClick={handleOptimize} disabled={optimize.isPending}>
          {optimize.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : result ? (
            <RefreshCw className="size-3.5" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          {result ? 'Régénérer' : 'Optimiser mon CV'}
        </Button>

        {result && (
          <>
            <p className="text-sm text-muted-foreground">{result.summary}</p>
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Compétences mises en avant</p>
              <div className="flex flex-wrap gap-1.5">
                {result.highlighted_skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground">Expériences (par ordre de pertinence)</p>
              {result.reordered_experience.map((exp: CVExperience, i: number) => (
                <div key={i} className="rounded-md border border-border p-2.5 text-sm">
                  <p className="font-medium">
                    {exp.title} · {exp.company}
                  </p>
                  {exp.description && <p className="text-muted-foreground">{exp.description}</p>}
                </div>
              ))}
            </div>
            <Button size="sm" variant="ghost" className="w-fit gap-1.5" onClick={handleDownload}>
              <Download className="size-3.5" />
              Télécharger
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export function DocumentsPanel({ jobId, company }: { jobId: string; company: string }) {
  const { data: documents, isLoading } = useJobDocuments(jobId)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    )
  }

  const latestCoverLetter = documents?.find((d) => d.type === 'cover_letter')?.content ?? null

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <CoverLetterCard jobId={jobId} company={company} content={latestCoverLetter} />
      <OptimizedCVCard jobId={jobId} company={company} />
    </div>
  )
}
