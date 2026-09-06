import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { Bot, Loader2, MailCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useAuth } from '@/contexts/AuthContext'
import { forgotPasswordSchema, type ForgotPasswordValues } from '@/lib/validation/auth'

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: ForgotPasswordValues) {
    setSubmitting(true)
    const { error } = await requestPasswordReset(values.email)
    setSubmitting(false)
    if (error) {
      toast.error(error)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
            <MailCheck className="size-8 text-primary" />
            <p className="font-medium">E-mail envoyé</p>
            <p className="text-sm text-muted-foreground">
              Si un compte existe avec cette adresse, un lien de réinitialisation vient d&apos;être
              envoyé.
            </p>
            <Button variant="outline" asChild className="mt-2">
              <Link to="/login">Retour à la connexion</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Bot className="mb-2 size-8 text-primary" />
          <CardTitle>Mot de passe oublié</CardTitle>
          <CardDescription>Recevez un lien pour réinitialiser votre mot de passe</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="vous@exemple.com" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Envoyer le lien
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                <Link to="/login" className="underline">
                  Retour à la connexion
                </Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
