import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useCalculateMatch, useProcessJob } from '@/hooks/useJobs'
import { manualJobSchema, type ManualJobValues } from '@/lib/validation/job'

export function AddJobDialog() {
  const [open, setOpen] = useState(false)
  const processJob = useProcessJob()
  const calculateMatch = useCalculateMatch()

  const form = useForm<ManualJobValues>({
    resolver: zodResolver(manualJobSchema),
    defaultValues: { title: '', company: '', location: '', application_url: '', description: '' },
  })

  const submitting = processJob.isPending || calculateMatch.isPending

  async function onSubmit(values: ManualJobValues) {
    try {
      const job = await processJob.mutateAsync({
        title: values.title,
        company: values.company,
        location: values.location || undefined,
        application_url: values.application_url || undefined,
        description: values.description || undefined,
      })
      toast.success('Offre importée, calcul du score en cours...')
      setOpen(false)
      form.reset()
      await calculateMatch.mutateAsync(job.id)
      toast.success('Score de compatibilité calculé')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Échec de l'import ou du calcul du score",
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="size-4" />
          Ajouter une offre
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter une offre manuellement</DialogTitle>
          <DialogDescription>
            Importez une offre par ses informations (ou son URL) — le score de compatibilité est
            calculé automatiquement à partir de votre CV principal.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poste</FormLabel>
                    <FormControl>
                      <Input placeholder="Data Analyst" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entreprise</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom de l'entreprise" {...field} />
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
                name="application_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lien de l&apos;offre</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={5} placeholder="Collez la description de l'offre" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Importer et analyser
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
