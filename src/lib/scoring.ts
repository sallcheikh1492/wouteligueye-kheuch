export function classifyScore(score: number) {
  if (score >= 90) return { emoji: '🔥', label: 'Excellente opportunité', className: 'bg-red-500/10 text-red-600 dark:text-red-400' }
  if (score >= 75) return { emoji: '⭐', label: 'Très bonne opportunité', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' }
  if (score >= 60) return { emoji: '👍', label: 'Opportunité intéressante', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' }
  if (score >= 40) return { emoji: '⚠️', label: 'À examiner', className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' }
  return { emoji: '❌', label: 'Faible correspondance', className: 'bg-gray-500/10 text-gray-500 dark:text-gray-400' }
}
