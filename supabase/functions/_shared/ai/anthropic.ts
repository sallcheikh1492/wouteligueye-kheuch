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
    return callAnthropicTool<CVAnalysis>({
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
  }

  // Ships with the "Moteur de matching IA" phase.
  analyzeJob(_input: JobInput): Promise<JobAnalysis> {
    throw new NotImplementedYetError('analyzeJob', 'Moteur de matching IA')
  }

  // Ships with the "Moteur de matching IA" phase.
  calculateMatch(_input: MatchInput): Promise<MatchResult> {
    throw new NotImplementedYetError('calculateMatch', 'Moteur de matching IA')
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
