import { useState } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Ban, Loader2, Search, ShieldCheck, ShieldOff, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
import { useAuth } from '@/contexts/AuthContext'
import { useAdminUsers, useManageUser } from '@/hooks/useAdmin'
import type { AdminUserRow } from '@/services/admin'

function isBanned(user: AdminUserRow): boolean {
  return !!user.banned_until && new Date(user.banned_until).getTime() > Date.now()
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth()
  const { data: users, isLoading, isError } = useAdminUsers()
  const manage = useManageUser()
  const [search, setSearch] = useState('')
  const [pendingAction, setPendingAction] = useState<{ userId: string; action: 'ban' | 'delete' } | null>(null)

  const filtered = (users ?? []).filter((u) => {
    const term = search.toLowerCase()
    return u.email.toLowerCase().includes(term) || (u.full_name ?? '').toLowerCase().includes(term)
  })

  function run(action: 'toggle_admin' | 'ban' | 'unban' | 'delete', userId: string, successMsg: string) {
    manage.mutate(
      { action, userId },
      {
        onSuccess: () => toast.success(successMsg),
        onError: (error) => toast.error(error instanceof Error ? error.message : "Échec de l'opération"),
      },
    )
  }

  function confirmPendingAction() {
    if (!pendingAction) return
    if (pendingAction.action === 'ban') {
      run('ban', pendingAction.userId, 'Utilisateur suspendu')
    } else {
      run('delete', pendingAction.userId, 'Utilisateur supprimé')
    }
    setPendingAction(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Administration — Utilisateurs</h1>
        <p className="text-sm text-muted-foreground">
          Gérez les comptes, les droits d&apos;administration et les suspensions.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom ou e-mail..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="text-sm font-medium">Erreur de chargement</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Impossible de récupérer la liste des utilisateurs.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Inscrit le</TableHead>
                  <TableHead>Dernière connexion</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => {
                  const banned = isBanned(u)
                  const isSelf = u.id === currentUser?.id
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <p className="font-medium">{u.full_name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(u.created_at), 'd MMM yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.last_sign_in_at
                          ? format(new Date(u.last_sign_in_at), 'd MMM yyyy', { locale: fr })
                          : 'Jamais'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {u.is_admin && <Badge>Admin</Badge>}
                          {banned && <Badge variant="destructive">Suspendu</Badge>}
                          {!u.email_confirmed_at && <Badge variant="outline">E-mail non confirmé</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5"
                            disabled={isSelf || manage.isPending}
                            onClick={() =>
                              run(
                                'toggle_admin',
                                u.id,
                                u.is_admin ? 'Droits administrateur retirés' : 'Droits administrateur accordés',
                              )
                            }
                          >
                            {u.is_admin ? <ShieldOff className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
                            {u.is_admin ? 'Rétrograder' : 'Promouvoir'}
                          </Button>
                          {banned ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1.5"
                              disabled={isSelf || manage.isPending}
                              onClick={() => run('unban', u.id, 'Utilisateur réactivé')}
                            >
                              <Ban className="size-3.5" />
                              Réactiver
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1.5"
                              disabled={isSelf || manage.isPending}
                              onClick={() => setPendingAction({ userId: u.id, action: 'ban' })}
                            >
                              <Ban className="size-3.5" />
                              Suspendre
                            </Button>
                          )}
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label="Supprimer"
                            disabled={isSelf || manage.isPending}
                            onClick={() => setPendingAction({ userId: u.id, action: 'delete' })}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {filtered.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">Aucun utilisateur trouvé.</p>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.action === 'delete' ? 'Supprimer ce compte ?' : 'Suspendre ce compte ?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.action === 'delete'
                ? 'Le compte et toutes ses données (CV, candidatures, préférences...) seront définitivement supprimés. Cette action est irréversible.'
                : "L'utilisateur ne pourra plus se connecter tant que le compte n'est pas réactivé."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPendingAction}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {manage.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
