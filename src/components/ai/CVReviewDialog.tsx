import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useUpdateProfile } from '@/hooks/useProfile'
import { useAddSkill, useSkills } from '@/hooks/useSkills'
import type { CVAnalysis } from '@/types/cv'

const CATEGORY_LABELS: Record<string, string> = {
  programming: 'Programmation',
  database: 'Bases de données',
  business_intelligence: 'Business Intelligence',
  data_analysis: 'Data & Analyse',
  machine_learning: 'Machine Learning',
  big_data: 'Big Data',
  cloud: 'Cloud',
  soft_skills: 'Soft Skills',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{title}</p>
      {children}
    </div>
  )
}

export function CVReviewDialog({
  analysis,
  open,
  onOpenChange,
}: {
  analysis: CVAnalysis | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: existingSkills } = useSkills()
  const updateProfile = useUpdateProfile()
  const addSkill = useAddSkill()

  const [summary, setSummary] = useState(() => analysis?.summary ?? '')
  const [selectedSkills, setSelectedSkills] = useState<Record<number, boolean>>(() =>
    Object.fromEntries((analysis?.skills ?? []).map((_, i) => [i, true])),
  )
  const [importing, setImporting] = useState(false)

  if (!analysis) return null

  const existingNames = new Set((existingSkills ?? []).map((s) => s.name.toLowerCase()))

  function handleSaveSummary() {
    updateProfile.mutate(
      { professional_summary: summary },
      {
        onSuccess: () => toast.success('Résumé enregistré dans votre profil'),
        onError: () => toast.error("Impossible d'enregistrer le résumé"),
      },
    )
  }

  async function handleImportSkills() {
    const toImport = analysis!.skills.filter(
      (s, i) => selectedSkills[i] && !existingNames.has(s.name.toLowerCase()),
    )
    if (toImport.length === 0) {
      toast.info('Aucune nouvelle compétence à importer')
      return
    }
    setImporting(true)
    const results = await Promise.allSettled(
      toImport.map((skill) => addSkill.mutateAsync({ name: skill.name, category: skill.category })),
    )
    setImporting(false)
    const succeeded = results.filter((r) => r.status === 'fulfilled').length
    if (succeeded > 0) toast.success(`${succeeded} compétence(s) importée(s)`)
    if (succeeded < toImport.length) toast.error('Certaines compétences n’ont pas pu être importées')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Analyse du CV</DialogTitle>
          <DialogDescription>
            Vérifiez les informations extraites avant de les ajouter à votre profil. Rien n&apos;est
            enregistré automatiquement.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <Section title="Résumé professionnel">
            <Textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
            <Button
              size="sm"
              variant="outline"
              className="mt-2 gap-2"
              onClick={handleSaveSummary}
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending && <Loader2 className="size-3.5 animate-spin" />}
              Enregistrer dans mon profil
            </Button>
          </Section>

          <Separator />

          <Section title={`Compétences (${analysis.skills.length})`}>
            <div className="flex flex-col gap-1.5">
              {analysis.skills.map((skill, i) => {
                const alreadyExists = existingNames.has(skill.name.toLowerCase())
                return (
                  <label
                    key={`${skill.name}-${i}`}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={!!selectedSkills[i]}
                      disabled={alreadyExists}
                      onCheckedChange={(checked) =>
                        setSelectedSkills((prev) => ({ ...prev, [i]: checked === true }))
                      }
                    />
                    {skill.name}
                    <span className="text-xs text-muted-foreground">
                      · {CATEGORY_LABELS[skill.category] ?? skill.category}
                      {alreadyExists && ' · déjà dans le profil'}
                    </span>
                  </label>
                )
              })}
            </div>
            <Button size="sm" className="mt-2 gap-2" onClick={handleImportSkills} disabled={importing}>
              {importing && <Loader2 className="size-3.5 animate-spin" />}
              Importer les compétences sélectionnées
            </Button>
          </Section>

          {analysis.experience.length > 0 && (
            <>
              <Separator />
              <Section title="Expériences">
                <div className="flex flex-col gap-2">
                  {analysis.experience.map((exp, i) => (
                    <div key={i} className="rounded-md border border-border p-2.5 text-sm">
                      <p className="font-medium">
                        {exp.title} · {exp.company}
                      </p>
                      {(exp.start_date || exp.end_date) && (
                        <p className="text-xs text-muted-foreground">
                          {exp.start_date} — {exp.end_date ?? 'présent'}
                        </p>
                      )}
                      {exp.description && <p className="mt-1 text-muted-foreground">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              </Section>
            </>
          )}

          {analysis.education.length > 0 && (
            <>
              <Separator />
              <Section title="Formation">
                <div className="flex flex-col gap-2">
                  {analysis.education.map((edu, i) => (
                    <div key={i} className="rounded-md border border-border p-2.5 text-sm">
                      <p className="font-medium">{edu.degree ?? 'Diplôme'} · {edu.institution}</p>
                      {edu.field && <p className="text-xs text-muted-foreground">{edu.field}</p>}
                      {(edu.start_date || edu.end_date) && (
                        <p className="text-xs text-muted-foreground">
                          {edu.start_date} — {edu.end_date ?? 'présent'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            </>
          )}

          {analysis.certifications.length > 0 && (
            <>
              <Separator />
              <Section title="Certifications">
                <ul className="list-inside list-disc text-sm text-muted-foreground">
                  {analysis.certifications.map((cert, i) => (
                    <li key={i}>
                      {cert.name}
                      {cert.issuer && ` — ${cert.issuer}`}
                      {cert.date && ` (${cert.date})`}
                    </li>
                  ))}
                </ul>
              </Section>
            </>
          )}

          {analysis.languages.length > 0 && (
            <>
              <Separator />
              <Section title="Langues">
                <p className="text-sm text-muted-foreground">
                  {analysis.languages.map((l) => `${l.name}${l.level ? ` (${l.level})` : ''}`).join(', ')}
                </p>
              </Section>
            </>
          )}

          {analysis.projects.length > 0 && (
            <>
              <Separator />
              <Section title="Projets">
                <div className="flex flex-col gap-2">
                  {analysis.projects.map((proj, i) => (
                    <div key={i} className="rounded-md border border-border p-2.5 text-sm">
                      <p className="font-medium">{proj.name}</p>
                      {proj.description && <p className="text-muted-foreground">{proj.description}</p>}
                    </div>
                  ))}
                </div>
              </Section>
            </>
          )}
        </div>

        <DialogFooter>
          <Label className="mr-auto text-xs text-muted-foreground">
            Rien n&apos;est jamais inventé : seules les informations présentes dans votre CV sont
            affichées.
          </Label>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
