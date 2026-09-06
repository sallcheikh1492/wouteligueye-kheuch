// Provider-agnostic contracts for every AI operation JobHunter AI performs.
// Implemented incrementally: analyzeCV ships with the CV import phase;
// analyzeJob / calculateMatch ship with the matching engine phase;
// generateCoverLetter / optimizeCV ship with the AI agents phase.
// All of these run exclusively in Edge Functions — never in the frontend —
// so the provider API key is never exposed to the browser.

export type SkillCategory =
  | 'programming'
  | 'database'
  | 'business_intelligence'
  | 'data_analysis'
  | 'machine_learning'
  | 'big_data'
  | 'cloud'
  | 'soft_skills'

export type CVSkill = {
  name: string
  category: SkillCategory
}

export type CVEducation = {
  institution: string
  degree?: string
  field?: string
  start_date?: string
  end_date?: string
}

export type CVExperience = {
  company: string
  title: string
  start_date?: string
  end_date?: string
  description?: string
}

export type CVProject = {
  name: string
  description?: string
  technologies?: string[]
}

export type CVLanguage = {
  name: string
  level?: string
}

export type CVCertification = {
  name: string
  issuer?: string
  date?: string
}

export type CVAnalysis = {
  summary: string
  skills: CVSkill[]
  education: CVEducation[]
  experience: CVExperience[]
  projects: CVProject[]
  languages: CVLanguage[]
  certifications: CVCertification[]
}

export type CVInput = {
  rawText: string
}

export type JobInput = {
  title: string
  company: string
  description: string
  requirements?: string
}

export type JobAnalysis = {
  summary: string
  required_skills: string[]
  preferred_skills: string[]
  seniority_level: string
  key_responsibilities: string[]
}

export type MatchInput = {
  cvAnalysis: CVAnalysis
  jobAnalysis: JobAnalysis
  userSkills: string[]
  preferredLocations: string[]
  jobLocation: string | null
  remotePreference: string
}

export type MatchResult = {
  overall_score: number
  skills_score: number
  experience_score: number
  education_score: number
  location_score: number
  keywords_score: number
  ai_context_score: number
  classification: 'EXCELLENT_MATCH' | 'GREAT_MATCH' | 'GOOD_MATCH' | 'TO_REVIEW' | 'WEAK_MATCH'
  strengths: string[]
  missing_skills: string[]
  recommendation: string
  reasoning_summary: string
}

export type CoverLetterInput = {
  cvAnalysis: CVAnalysis
  jobTitle: string
  company: string
  jobDescription: string
  tone?: 'formal' | 'enthusiastic' | 'concise'
}

export type OptimizeCVInput = {
  cvAnalysis: CVAnalysis
  jobTitle: string
  jobDescription: string
}

export type OptimizedCV = {
  summary: string
  highlighted_skills: string[]
  reordered_experience: CVExperience[]
}

export interface AIProvider {
  analyzeCV(input: CVInput): Promise<CVAnalysis>
  analyzeJob(input: JobInput): Promise<JobAnalysis>
  calculateMatch(input: MatchInput): Promise<MatchResult>
  generateCoverLetter(input: CoverLetterInput): Promise<string>
  optimizeCV(input: OptimizeCVInput): Promise<OptimizedCV>
}

export class NotImplementedYetError extends Error {
  constructor(method: string, phase: string) {
    super(`${method}() ships with the "${phase}" phase — not implemented yet.`)
    this.name = 'NotImplementedYetError'
  }
}
