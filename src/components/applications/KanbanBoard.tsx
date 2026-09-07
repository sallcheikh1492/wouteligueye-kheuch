import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { cn } from 'cn'
import { Card } from '@/components/ui/card'
import { useUpdateApplication } from '@/hooks/useApplications'
import type { ApplicationWithJob } from '@/services/applications'
import type { ApplicationStatus } from '@/types/database'

export const KANBAN_COLUMNS: { value: ApplicationStatus; label: string }[] = [
  { value: 'discovered', label: 'Découverte' },
  { value: 'interested', label: 'Intéressé' },
  { value: 'reviewing', label: 'En préparation' },
  { value: 'documents_ready', label: 'Documents prêts' },
  { value: 'ready_to_apply', label: 'Prête à envoyer' },
  { value: 'submitted', label: 'Envoyée' },
  { value: 'interview', label: 'Entretien' },
  { value: 'accepted', label: 'Acceptée' },
  { value: 'rejected', label: 'Refusée' },
  { value: 'no_response', label: 'Sans réponse' },
  { value: 'withdrawn', label: 'Retirée' },
]

function ApplicationCard({ application, dragging }: { application: ApplicationWithJob; dragging?: boolean }) {
  return (
    <Card className={cn('gap-1 p-3 shadow-sm', dragging && 'shadow-lg')}>
      <Link
        to={`/jobs/${application.job_id}`}
        className="block truncate text-sm font-medium hover:underline"
      >
        {application.jobs.title}
      </Link>
      <p className="truncate text-xs text-muted-foreground">{application.jobs.company}</p>
    </Card>
  )
}

function DraggableApplicationCard({ application }: { application: ApplicationWithJob }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: application.id })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn('cursor-grab touch-none active:cursor-grabbing', isDragging && 'opacity-30')}
    >
      <ApplicationCard application={application} />
    </div>
  )
}

function KanbanColumn({
  status,
  label,
  applications,
}: {
  status: ApplicationStatus
  label: string
  applications: ApplicationWithJob[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex w-64 shrink-0 flex-col gap-2 rounded-lg border border-border bg-muted/20 p-2.5 transition-colors',
        isOver && 'border-primary bg-primary/5',
      )}
    >
      <div className="flex items-center justify-between px-0.5">
        <p className="text-sm font-medium">{label}</p>
        <span className="text-xs text-muted-foreground">{applications.length}</span>
      </div>
      <div className="flex min-h-16 flex-col gap-2">
        {applications.map((application) => (
          <DraggableApplicationCard key={application.id} application={application} />
        ))}
      </div>
    </div>
  )
}

// Every application_status value is its own column (a real hiring pipeline
// has this many meaningful stages) — the board scrolls horizontally rather
// than collapsing them, same pattern as the wide tables elsewhere in the app.
export function KanbanBoard({ applications }: { applications: ApplicationWithJob[] }) {
  const updateApplication = useUpdateApplication()
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  )

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const application = applications.find((a) => a.id === active.id)
    const newStatus = over.id as ApplicationStatus
    if (!application || application.status === newStatus) return

    updateApplication.mutate(
      { id: application.id, patch: { status: newStatus } },
      { onError: () => toast.error('Impossible de déplacer la candidature') },
    )
  }

  const activeApplication = applications.find((a) => a.id === activeId) ?? null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event: DragStartEvent) => setActiveId(event.active.id as string)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {KANBAN_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.value}
            status={column.value}
            label={column.label}
            applications={applications.filter((a) => a.status === column.value)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeApplication ? <ApplicationCard application={activeApplication} dragging /> : null}
      </DragOverlay>
    </DndContext>
  )
}
