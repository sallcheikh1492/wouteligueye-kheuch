// Deterministic sub-scores for the matching engine (spec section 12). These
// never call an AI model — only the "AI Context" 10% slice comes from the
// model, so no provider can turn the score into a black box.
import type { CVEducation, CVExperience } from '../ai/types.ts'

const COMBINING_MARK_START = 0x0300
const COMBINING_MARK_END = 0x036f
const DIACRITICS_REGEX = new RegExp(
  `[${String.fromCharCode(COMBINING_MARK_START)}-${String.fromCharCode(COMBINING_MARK_END)}]`,
  'g',
)

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(DIACRITICS_REGEX, '').trim()
}

export function calculateSkillsScore(
  userSkills: string[],
  requiredSkills: string[],
  preferredSkills: string[],
): { score: number; missing: string[] } {
  const userSet = new Set(userSkills.map(normalize))
  const missing = requiredSkills.filter((s) => !userSet.has(normalize(s)))

  const requiredRatio = requiredSkills.length
    ? (requiredSkills.length - missing.length) / requiredSkills.length
    : 1
  const preferredMatches = preferredSkills.filter((s) => userSet.has(normalize(s))).length
  const preferredRatio = preferredSkills.length ? preferredMatches / preferredSkills.length : 1

  const score = Math.round((requiredRatio * 0.75 + preferredRatio * 0.25) * 100)
  return { score: Math.max(0, Math.min(100, score)), missing }
}

function parseYear(value?: string): number | null {
  if (!value) return null
  const match = value.match(/\d{4}/)
  return match ? Number(match[0]) : null
}

function estimateYearsOfExperience(experience: CVExperience[]): number {
  const currentYear = new Date().getFullYear()
  let totalMonths = 0
  for (const exp of experience) {
    const startYear = parseYear(exp.start_date)
    if (!startYear) continue
    const endYear = exp.end_date ? (parseYear(exp.end_date) ?? currentYear) : currentYear
    if (endYear > startYear) {
      totalMonths += (endYear - startYear) * 12
    }
  }
  return Math.round((totalMonths / 12) * 10) / 10
}

const SENIORITY_TARGET_YEARS: Record<string, number> = {
  junior: 1,
  intermediate: 3,
  mid: 3,
  senior: 6,
  lead: 9,
  principal: 12,
}

export function calculateExperienceScore(experience: CVExperience[], seniorityLevel: string): number {
  const years = estimateYearsOfExperience(experience)
  const target = SENIORITY_TARGET_YEARS[normalize(seniorityLevel)] ?? 2
  if (target === 0) return 100
  return Math.max(0, Math.min(100, Math.round((years / target) * 100)))
}

const RELEVANT_FIELD_KEYWORDS = [
  'data',
  'informatique',
  'statistique',
  'business intelligence',
  'computer science',
  'mathematique',
  'gestion',
  'ingenierie',
  'analytics',
]

export function calculateEducationScore(education: CVEducation[]): number {
  if (education.length === 0) return 40
  const hasRelevantField = education.some((e) =>
    RELEVANT_FIELD_KEYWORDS.some(
      (k) => normalize(e.field ?? '').includes(k) || normalize(e.degree ?? '').includes(k),
    ),
  )
  return hasRelevantField ? 100 : 70
}

export function calculateLocationScore(
  jobLocation: string | null,
  preferredLocations: string[],
  remotePreference: string,
): number {
  const normalizedJobLocation = jobLocation ? normalize(jobLocation) : ''
  const isRemoteJob = /remote|teletravail|a distance|full remote/.test(normalizedJobLocation)

  if (remotePreference === 'remote') {
    return isRemoteJob ? 100 : 30
  }
  if (!jobLocation) {
    return remotePreference === 'any' ? 70 : 50
  }
  const matches = preferredLocations.some((loc) => {
    const normalizedLoc = normalize(loc)
    return normalizedJobLocation.includes(normalizedLoc) || normalizedLoc.includes(normalizedJobLocation)
  })
  if (matches || isRemoteJob) return 100
  if (remotePreference === 'any' || remotePreference === 'hybrid') return 60
  return 30
}

const STOPWORDS = new Set([
  'the', 'and', 'de', 'la', 'le', 'les', 'des', 'et', 'a', 'en', 'pour', 'dans', 'un', 'une',
  'of', 'to', 'with', 'for', 'on', 'au', 'aux', 'du', 'ou', 'que', 'qui', 'est', 'sont', 'vous',
  'nous', 'votre', 'notre', 'this', 'that', 'from', 'are', 'will', 'have', 'has',
])

function tokenize(text: string): string[] {
  return normalize(text)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 3 && !STOPWORDS.has(t))
}

export function calculateKeywordsScore(cvText: string, jobDescription: string): number {
  const jobTokens = tokenize(jobDescription)
  if (jobTokens.length === 0) return 50
  const cvTokens = new Set(tokenize(cvText))
  const uniqueJobTokens = new Set(jobTokens)
  const matches = [...uniqueJobTokens].filter((t) => cvTokens.has(t))
  const ratio = matches.length / uniqueJobTokens.size
  // Exact keyword overlap between a CV and a job description is naturally
  // partial even for a strong match, so the ratio is scaled up before capping.
  return Math.round(Math.min(1, ratio * 2) * 100)
}

export function classifyScore(
  score: number,
): 'EXCELLENT_MATCH' | 'GREAT_MATCH' | 'GOOD_MATCH' | 'TO_REVIEW' | 'WEAK_MATCH' {
  if (score >= 90) return 'EXCELLENT_MATCH'
  if (score >= 75) return 'GREAT_MATCH'
  if (score >= 60) return 'GOOD_MATCH'
  if (score >= 40) return 'TO_REVIEW'
  return 'WEAK_MATCH'
}

const RECOMMENDATION_BY_CLASSIFICATION: Record<string, string> = {
  EXCELLENT_MATCH: 'Excellente opportunité — candidature vivement recommandée.',
  GREAT_MATCH: 'Très bonne opportunité — candidature recommandée.',
  GOOD_MATCH: 'Opportunité intéressante, à considérer sérieusement.',
  TO_REVIEW: 'Correspondance partielle — à examiner avant de postuler.',
  WEAK_MATCH: 'Faible correspondance avec votre profil actuel.',
}

export function recommendationFor(classification: string): string {
  return RECOMMENDATION_BY_CLASSIFICATION[classification] ?? ''
}
