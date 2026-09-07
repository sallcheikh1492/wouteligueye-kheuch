import { useState } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}) {
  const [draft, setDraft] = useState('')

  function commit() {
    const trimmed = draft.trim()
    if (trimmed && !value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...value, trimmed])
    }
    setDraft('')
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            commit()
          }
        }}
        onBlur={commit}
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1.5 pr-1">
              {tag}
              <button
                type="button"
                aria-label={`Retirer ${tag}`}
                onClick={() => onChange(value.filter((v) => v !== tag))}
                className="rounded-full p-0.5 hover:bg-background/50"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
