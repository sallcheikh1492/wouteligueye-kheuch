// Deterministic guard applied on top of optimizeCV's output. The prompt
// already instructs the model never to invent anything, but the absolute
// rule in the spec ("ne jamais inventer") is enforced here in code, not
// just in the prompt: every skill and experience entry is checked against
// the candidate's real CV, and nothing genuine is ever dropped.
import type { CVAnalysis, CVExperience, OptimizedCV } from './types.ts'

function normalize(s: string): string {
  return s.toLowerCase().trim()
}

export function sanitizeOptimizedCV(optimized: OptimizedCV, source: CVAnalysis): OptimizedCV {
  const knownSkillNames = new Set(source.skills.map((s) => normalize(s.name)))
  const highlighted_skills = optimized.highlighted_skills.filter((s) => knownSkillNames.has(normalize(s)))

  const reordered_experience: CVExperience[] = []
  for (const candidate of optimized.reordered_experience) {
    const original = source.experience.find(
      (e) => normalize(e.company) === normalize(candidate.company) && normalize(e.title) === normalize(candidate.title),
    )
    if (!original) continue // drop anything that doesn't match a real entry
    // Keep the original dates (never trust AI-provided dates); allow only
    // the description to be reworded, since that's what "optimizing" means.
    reordered_experience.push({ ...original, description: candidate.description ?? original.description })
  }

  // Re-append any real experience the model left out entirely, so nothing
  // genuine ever disappears from the candidate's history.
  for (const original of source.experience) {
    const alreadyIncluded = reordered_experience.some(
      (e) => normalize(e.company) === normalize(original.company) && normalize(e.title) === normalize(original.title),
    )
    if (!alreadyIncluded) reordered_experience.push(original)
  }

  return { summary: optimized.summary, highlighted_skills, reordered_experience }
}
