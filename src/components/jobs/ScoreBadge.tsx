import { cn } from 'cn'
import { classifyScore } from '@/lib/scoring'

export function ScoreBadge({ score, className }: { score: number; className?: string }) {
  const { emoji, label } = classifyScore(score)
  const tier = classifyScore(score).className

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        tier,
        className,
      )}
      title={label}
    >
      <span aria-hidden="true">{emoji}</span>
      {score}
    </span>
  )
}
