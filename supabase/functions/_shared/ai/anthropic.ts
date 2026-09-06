// Anthropic Claude implementation of AIProvider. Runs server-side only
// (Edge Functions) — ANTHROPIC_API_KEY is read from environment secrets
// and never sent to the frontend.
import type {
  AIProvider,
  CVAnalysis,
  CVInput,
  CoverLetterInput,
  JobAnalysis,
  JobInput,
  MatchInput,
  MatchResult,
  OptimizeCVInput,
  OptimizedCV,
} from './types.ts'
import { NotImplementedYetError } from './types.ts'
import { aiContextSchema, cvAnalysisSchema, jobAnalysisSchema } from './validation.ts'
import {
  calculateEducationScore,
  calculateExperienceScore,
  calculateKeywordsScore,
  calculateLocationScore,
  calculateSkillsScore,
  classifyScore,
  recommendationFor,
} from '../matching/scoring.ts'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const DEFAULT_MODEL = 'claude-sonnet-5'

const SKILL_CATEGORIES = [
  'programming',
  'database',
  'business_intelligence',
  'data_analysis',
  'machine_learning',
  'big_data',
  'cloud',
  'soft_skills',
]

const CV_EXTRACTION_TOOL = {
  name: 'record_cv_analysis',
  description:
    'Records the structured information extracted from a candidate CV. Only use information ' +
    'that is literally present in the CV text — never invent experience, education, ' +
    'certifications or skills that are not stated.',
  input_schema: {
    type: 'object',
    properties: {
      summary: { type: 'string', description: 'A concise 2-4 sentence professional summary.' },
      skills: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            category: { type: 'string', enum: SKILL_CATEGORIES },
          },
          required: ['name', 'category'],
        },
      },
      education: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            institution: { type: 'string' },
            degree: { type: 'string' },
            field: { type: 'string' },
            start_date: { type: 'string' },
            end_date: { type: 'string' },
          },
          required: ['institution'],
        },
      },
      experience: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            company: { type: 'string' },
            title: { type: 'string' },
            start_date: { type: 'string' },
            end_date: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['company', 'title'],
        },
      },
      projects: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            technologies: { type: 'array', items: { type: 'string' } },
          },
          required: ['name'],
        },
      },
      languages: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            level: { type: 'string' },
          },
          required: ['name'],
        },
      },
      certifications: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            issuer: { type: 'string' },
            date: { type: 'string' },
          },
          required: ['name'],
        },
      },
    },
    required: ['summary', 'skills', 'education', 'experience', 'projects', 'languages', 'certifications'],
  },
}

const JOB_ANALYSIS_TOOL = {
  name: 'record_job_analysis',
  description: 'Records structured information extracted from a job posting.',
  input_schema: {
    type: 'object',
    properties: {
      summary: { type: 'string', description: 'A concise 2-3 sentence summary of the role.' },
      required_skills: { type: 'array', items: { type: 'string' } },
      preferred_skills: { type: 'array', items: { type: 'string' } },
      seniority_level: {
        type: 'string',
        enum: ['junior', 'intermediate', 'senior', 'lead', 'principal'],
      },
      key_responsibilities: { type: 'array', items: { type: 'string' } },
    },
    required: ['summary', 'required_skills', 'preferred_skills', 'seniority_level', 'key_responsibilities'],
  },
}

const AI_CONTEXT_TOOL = {
  name: 'record_contextual_assessment',
  description:
    'Records a holistic contextual assessment of how well a candidate fits a job, beyond ' +
    'simple keyword overlap (career trajectory, industry relevance, growth potential).',
  input_schema: {
    type: 'object',
    properties: {
      ai_context_score: { type: 'number', minimum: 0, maximum: 100 },
      strengths: { type: 'array', items: { type: 'string' }, description: '2-4 concrete strengths.' },
      reasoning_summary: { type: 'string', description: 'One paragraph, in French.' },
    },
    required: ['ai_context_score', 'strengths', 'reasoning_summary'],
  },
}

async function callAnthropicTool<T>(params: {
  apiKey: string
  model: string
  system: string
  userMessage: string
  tool: { name: string; description: string; input_schema: Record<string, unknown> }
  maxTokens?: number
}): Promise<T> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': params.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: params.maxTokens ?? 4096,
      system: params.system,
      tools: [params.tool],
      tool_choice: { type: 'tool', name: params.tool.name },
      messages: [{ role: 'user', content: params.userMessage }],
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Anthropic API error (${response.status}): ${body}`)
  }

  const data = await response.json()
  const toolUse = data.content?.find((block: { type: string }) => block.type === 'tool_use')
  if (!toolUse) {
    throw new Error('Anthropic response did not include the expected tool_use block')
  }
  return toolUse.input as T
}

export class AnthropicProvider implements AIProvider {
  private apiKey: string
  private model: string

  constructor(apiKey: string, model = DEFAULT_MODEL) {
    this.apiKey = apiKey
    this.model = model
  }

  async analyzeCV(input: CVInput): Promise<CVAnalysis> {
    const result = await callAnthropicTool<CVAnalysis>({
      apiKey: this.apiKey,
      model: this.model,
      system:
        'You are a precise CV/resume parser for a job-search assistant. Extract only ' +
        'information explicitly present in the text. Never fabricate experience, education, ' +
        'skills, or certifications. If a field is not present, omit it or leave the array empty. ' +
        `Classify each skill into exactly one of these categories: ${SKILL_CATEGORIES.join(', ')}.`,
      userMessage: `Extract the structured data from this CV:\n\n${input.rawText}`,
      tool: CV_EXTRACTION_TOOL,
    })
    return cvAnalysisSchema.parse(result)
  }

  async analyzeJob(input: JobInput): Promise<JobAnalysis> {
    const result = await callAnthropicTool<JobAnalysis>({
      apiKey: this.apiKey,
      model: this.model,
      system:
        'You are analyzing a job posting for a job-search assistant. Extract only what is ' +
        'stated or clearly implied by the posting — do not invent requirements.',
      userMessage:
        `Title: ${input.title}\nCompany: ${input.company}\n\n` +
        `Description:\n${input.description}\n\n` +
        `Requirements:\n${input.requirements ?? '(not specified)'}`,
      tool: JOB_ANALYSIS_TOOL,
    })
    return jobAnalysisSchema.parse(result)
  }

  async calculateMatch(input: MatchInput): Promise<MatchResult> {
    // 1. Deterministic sub-scores (90% of the weighted total) — no AI involved.
    const userSkillNames = input.userSkills.length
      ? input.userSkills
      : input.cvAnalysis.skills.map((s) => s.name)

    const skills = calculateSkillsScore(
      userSkillNames,
      input.jobAnalysis.required_skills,
      input.jobAnalysis.preferred_skills,
    )
    const experienceScore = calculateExperienceScore(input.cvAnalysis.experience, input.jobAnalysis.seniority_level)
    const educationScore = calculateEducationScore(input.cvAnalysis.education)
    const locationScore = calculateLocationScore(input.jobLocation, input.preferredLocations, input.remotePreference)
    const keywordsScore = calculateKeywordsScore(input.cvRawText, input.jobDescription)

    // 2. AI contextual assessment (the remaining 10%) — holistic fit judgment
    // that keyword/rule matching cannot capture (career trajectory, etc).
    const aiContextResult = await callAnthropicTool<{
      ai_context_score: number
      strengths: string[]
      reasoning_summary: string
    }>({
      apiKey: this.apiKey,
      model: this.model,
      system:
        'You assess the overall, holistic fit between a candidate and a job — beyond simple ' +
        'keyword matching — to complement deterministic sub-scores already computed. Respond in French.',
      userMessage:
        `CV summary: ${input.cvAnalysis.summary}\n\n` +
        `Job summary: ${input.jobAnalysis.summary}\n` +
        `Key responsibilities: ${input.jobAnalysis.key_responsibilities.join('; ')}\n\n` +
        `Deterministic sub-scores already computed — skills: ${skills.score}, experience: ` +
        `${experienceScore}, education: ${educationScore}, location: ${locationScore}, ` +
        `keywords: ${keywordsScore} (all out of 100). Give a holistic contextual score, 2-4 ` +
        'concrete strengths, and a one-paragraph reasoning summary.',
      tool: AI_CONTEXT_TOOL,
    })
    const aiContext = aiContextSchema.parse(aiContextResult)

    // 3. Weighted blend per spec section 12: skills 35%, experience 20%,
    // education 15%, location 10%, keywords 10%, AI context 10%.
    const overallScore = Math.round(
      skills.score * 0.35 +
        experienceScore * 0.2 +
        educationScore * 0.15 +
        locationScore * 0.1 +
        keywordsScore * 0.1 +
        aiContext.ai_context_score * 0.1,
    )
    const classification = classifyScore(overallScore)

    return {
      overall_score: overallScore,
      skills_score: skills.score,
      experience_score: experienceScore,
      education_score: educationScore,
      location_score: locationScore,
      keywords_score: keywordsScore,
      ai_context_score: aiContext.ai_context_score,
      classification,
      strengths: aiContext.strengths,
      missing_skills: skills.missing,
      recommendation: recommendationFor(classification),
      reasoning_summary: aiContext.reasoning_summary,
    }
  }

  // Ships with the "Agents IA" phase.
  generateCoverLetter(_input: CoverLetterInput): Promise<string> {
    throw new NotImplementedYetError('generateCoverLetter', 'Agents IA')
  }

  // Ships with the "Agents IA" phase.
  optimizeCV(_input: OptimizeCVInput): Promise<OptimizedCV> {
    throw new NotImplementedYetError('optimizeCV', 'Agents IA')
  }
}
