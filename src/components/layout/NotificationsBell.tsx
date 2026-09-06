import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from '@/hooks/useNotifications'

export function NotificationsBell() {
  const { data: unreadCount } = useUnreadNotificationCount()
  const { data: notifications, isLoading } = useNotifications(10)
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const hasUnread = (unreadCount ?? 0) > 0
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-4" />
          {hasUnread && (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border p-3">
          <p className="text-sm font-medium">Notifications</p>
          {hasUnread && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="size-3.5" />
              Tout marquer lu
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-3">
              <Skeleton className="h-12 rounded-md" />
              <Skeleton className="h-12 rounded-md" />
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Aucune notification.</p>
          ) : (
            <ul className="flex flex-col">
              {notifications.map((notification) => {
                const content = (
                  <div
                    className={`flex flex-col gap-0.5 border-b border-border p-3 text-sm last:border-b-0 hover:bg-accent ${
                      notification.is_read ? '' : 'bg-accent/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{notification.title}</p>
                      {!notification.is_read && <Badge className="shrink-0 px-1.5">Nouveau</Badge>}
                    </div>
                    <p className="text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                )

                return (
                  <li key={notification.id}>
                    {notification.related_job_id ? (
                      <Link
                        to={`/jobs/${notification.related_job_id}`}
                        onClick={() => {
                          if (!notification.is_read) markRead.mutate(notification.id)
                          setOpen(false)
                        }}
                      >
                        {content}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => !notification.is_read && markRead.mutate(notification.id)}
                      >
                        {content}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
