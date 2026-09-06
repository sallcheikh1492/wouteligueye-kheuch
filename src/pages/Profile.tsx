import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import { useAddSkill, useDeleteSkill, useSkills } from '@/hooks/useSkills'
import { profileSchema, type ProfileValues } from '@/lib/validation/profile'
import { seedDemoProfile } from '@/services/profiles'
import type { SkillCategory, SkillLevel } from '@/types/database'

const CATEGORY_LABELS: Record<SkillCategory, string> = {
  programming: 'Programmation',
  database: 'Bases de données',
  business_intelligence: 'Business Intelligence',
  data_analysis: 'Data & Analyse',
  machine_learning: 'Machine Learning',
  big_data: 'Big Data',
  cloud: 'Cloud',
  soft_skills: 'Soft Skills',
}

const LEVEL_LABELS: Record<SkillLevel, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
  expert: 'Expert',
}

function ProfileForm() {
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      location: '',
      phone: '',
      linkedin_url: '',
      portfolio_url: '',
      github_url: '',
      professional_summary: '',
    },
  })

  useEffect(() => {
    if (!profile) return
    form.reset({
      full_name: profile.full_name ?? '',
      location: profile.location ?? '',
      phone: profile.phone ?? '',
      linkedin_url: profile.linkedin_url ?? '',
      portfolio_url: profile.portfolio_url ?? '',
      github_url: profile.github_url ?? '',
      professional_summary: profile.professional_summary ?? '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  function onSubmit(values: ProfileValues) {
    updateProfile.mutate(
      {
        full_name: values.full_name,
        location: values.location || null,
        phone: values.phone || null,
        linkedin_url: values.linkedin_url || null,
        portfolio_url: values.portfolio_url || null,
        github_url: values.github_url || null,
        professional_summary: values.professional_summary || null,
      },
      {
        onSuccess: () => toast.success('Profil mis à jour'),
        onError: () => toast.error('Impossible de mettre à jour le profil'),
      },
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-64 rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Informations générales</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom complet</FormLabel>
                  <FormControl>
                    <Input placeholder="Votre nom complet" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Localisation</FormLabel>
                  <FormControl>
                    <Input placeholder="Dakar, Sénégal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone</FormLabel>
                  <FormControl>
                    <Input placeholder="+221 ..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="linkedin_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn</FormLabel>
                  <FormControl>
                    <Input placeholder="https://linkedin.com/in/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="portfolio_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portfolio</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="github_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub</FormLabel>
                  <FormControl>
                    <Input placeholder="https://github.com/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="professional_summary"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Résumé professionnel</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="Résumé généré à partir de votre CV" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="sm:col-span-2">
              <Button type="submit" disabled={updateProfile.isPending} className="gap-2">
                {updateProfile.isPending && <Loader2 className="size-4 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function SkillsSection() {
  const { data: skills, isLoading } = useSkills()
  const addSkill = useAddSkill()
  const deleteSkill = useDeleteSkill()
  const [name, setName] = useState('')
  const [category, setCategory] = useState<SkillCategory>('data_analysis')

  function handleAdd() {
    if (!name.trim()) return
    addSkill.mutate(
      { name: name.trim(), category },
      {
        onSuccess: () => {
          setName('')
          toast.success('Compétence ajoutée')
        },
        onError: () => toast.error("Impossible d'ajouter cette compétence (déjà existante ?)"),
      },
    )
  }

  function handleDelete(id: string) {
    deleteSkill.mutate(id, { onError: () => toast.error('Impossible de supprimer cette compétence') })
  }

  const grouped = (skills ?? []).reduce<Record<string, typeof skills>>((acc, skill) => {
    acc[skill.category] = [...(acc[skill.category] ?? []), skill]
    return acc
  }, {})

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Compétences</CardTitle>
        <CardDescription>
          Importez un CV depuis la page « Mes CV » pour les extraire automatiquement, ou ajoutez-les
          manuellement ci-dessous.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Ex : Power BI"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Select value={category} onValueChange={(v) => setCategory(v as SkillCategory)}>
            <SelectTrigger className="sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} disabled={addSkill.isPending} className="gap-2 sm:w-auto">
            <Plus className="size-4" />
            Ajouter
          </Button>
        </div>

        {isLoading ? (
          <Skeleton className="h-24 rounded-lg" />
        ) : !skills || skills.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune compétence enregistrée pour le moment.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {Object.entries(grouped).map(([cat, catSkills]) => (
              <div key={cat}>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  {CATEGORY_LABELS[cat as SkillCategory]}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {catSkills?.map((skill) => (
                    <Badge key={skill.id} variant="secondary" className="gap-1.5 pr-1">
                      {skill.name}
                      {skill.level && (
                        <span className="text-muted-foreground">· {LEVEL_LABELS[skill.level]}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(skill.id)}
                        aria-label={`Supprimer ${skill.name}`}
                        className="rounded-full p-0.5 hover:bg-background/50"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DemoProfileButton() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      await seedDemoProfile()
      await queryClient.invalidateQueries({ queryKey: ['skills', user?.id] })
      await queryClient.invalidateQueries({ queryKey: ['job_preferences', user?.id] })
      toast.success('Profil de démonstration chargé (Business Intelligence / Data Analyst)')
    } catch {
      toast.error('Impossible de charger le profil de démonstration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={loading} className="gap-2">
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
      Charger un exemple de profil
    </Button>
  )
}

export default function Profile() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Profil professionnel</h1>
          <p className="text-sm text-muted-foreground">
            Vos informations, utilisées pour le matching et la génération de documents.
          </p>
        </div>
        <DemoProfileButton />
      </div>

      <ProfileForm />
      <SkillsSection />
    </div>
  )
}
