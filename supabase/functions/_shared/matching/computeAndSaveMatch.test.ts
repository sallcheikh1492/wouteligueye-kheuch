import { describe, expect, it, vi } from 'vitest'
import { computeAndSaveMatch } from './computeAndSaveMatch.ts'
import { createFakeSupabaseClient, type RecordedCall } from '../testing/fakeSupabaseClient.ts'
import type { AIProvider, CVAnalysis, JobAnalysis, MatchResult } from '../ai/types.ts'

const cvAnalysis: CVAnalysis = {
  summary: 'Data analyst with BI experience.',
  skills: [{ name: 'SQL', category: 'data_analysis' }],
  education: [],
  experience: [],
  projects: [],
  languages: [],
  certifications: [],
}

const jobAnalysis: JobAnalysis = {
  summary: 'Looking for a data analyst.',
  required_skills: ['SQL'],
  preferred_skills: [],
  seniority_level: 'junior',
  key_responsibilities: [],
}

const matchResult: MatchResult = {
  overall_score: 80,
  skills_score: 90,
  experience_score: 70,
  education_score: 100,
  location_score: 60,
  keywords_score: 50,
  ai_context_score: 75,
  classification: 'GREAT_MATCH',
  strengths: ['Strong SQL'],
  missing_skills: [],
  recommendation: 'Recommended',
  reasoning_summary: 'Good fit.',
}

function makeProvider(): AIProvider {
  return {
    analyzeCV: vi.fn(),
    analyzeJob: vi.fn().mockResolvedValue(jobAnalysis),
    calculateMatch: vi.fn().mockResolvedValue(matchResult),
    generateCoverLetter: vi.fn(),
    optimizeCV: vi.fn(),
  }
}

const baseJob = {
  id: 'job-1',
  title: 'Data Analyst',
  company: 'Acme',
  description: 'Analyze data',
  requirements: null,
  location: 'Dakar',
  ai_analysis: null as JobAnalysis | null,
}

describe('computeAndSaveMatch', () => {
  it('returns null without calling the AI when the user has no primary CV', async () => {
    const userClient = createFakeSupabaseClient({ cvs: { data: null, error: null } })
    const serviceClient = createFakeSupabaseClient({})
    const provider = makeProvider()

    const result = await computeAndSaveMatch({ userClient, serviceClient, provider, userId: 'user-1', job: baseJob })

    expect(result).toBeNull()
    expect(provider.analyzeJob).not.toHaveBeenCalled()
    expect(provider.calculateMatch).not.toHaveBeenCalled()
  })

  it('returns null when the primary CV exists but has not been analyzed yet', async () => {
    const userClient = createFakeSupabaseClient({
      cvs: { data: { parsed_data: null, raw_text: null }, error: null },
    })
    const serviceClient = createFakeSupabaseClient({})
    const provider = makeProvider()

    const result = await computeAndSaveMatch({ userClient, serviceClient, provider, userId: 'user-1', job: baseJob })

    expect(result).toBeNull()
    expect(provider.calculateMatch).not.toHaveBeenCalled()
  })

  it('computes and saves a match, reusing an already-cached job analysis', async () => {
    const upsertCalls: RecordedCall[] = []
    const userClient = createFakeSupabaseClient({
      cvs: { data: { parsed_data: cvAnalysis, raw_text: 'raw cv text' }, error: null },
      skills: { data: [{ name: 'SQL' }, { name: 'Python' }], error: null },
      job_preferences: {
        data: { preferred_locations: ['Dakar'], remote_preference: 'hybrid' },
        error: null,
      },
    })
    const serviceClient = createFakeSupabaseClient({ job_matches: { data: null, error: null } }, upsertCalls)
    const provider = makeProvider()
    const job = { ...baseJob, ai_analysis: jobAnalysis } // already cached

    const result = await computeAndSaveMatch({ userClient, serviceClient, provider, userId: 'user-1', job })

    expect(result).toEqual(matchResult)
    // Cached analysis means ensureJobAnalysis should never call the AI again.
    expect(provider.analyzeJob).not.toHaveBeenCalled()
    expect(provider.calculateMatch).toHaveBeenCalledWith({
      cvAnalysis,
      cvRawText: 'raw cv text',
      userSkills: ['SQL', 'Python'],
      jobAnalysis,
      jobDescription: 'Analyze data',
      jobLocation: 'Dakar',
      preferredLocations: ['Dakar'],
      remotePreference: 'hybrid',
    })

    const upsertCall = upsertCalls.find((c) => c.table === 'job_matches' && c.method === 'upsert')
    expect(upsertCall).toBeDefined()
    const [payload, options] = upsertCall!.args as [Record<string, unknown>, Record<string, unknown>]
    expect(payload).toMatchObject({
      job_id: 'job-1',
      user_id: 'user-1',
      overall_score: 80,
      skills_score: 90,
      experience_score: 70,
      education_score: 100,
      location_score: 60,
      keywords_score: 50,
      missing_skills: [],
      strengths: ['Strong SQL'],
      recommendation: 'Recommended',
    })
    expect(payload.ai_analysis).toMatchObject({
      ai_context_score: 75,
      reasoning_summary: 'Good fit.',
      weights: { skills: 0.35, experience: 0.2, education: 0.15, location: 0.1, keywords: 0.1, ai_context: 0.1 },
    })
    expect(options).toEqual({ onConflict: 'job_id,user_id' })
  })

  it('runs analyzeJob and caches the result on jobs when none exists yet', async () => {
    const jobsCalls: RecordedCall[] = []
    const userClient = createFakeSupabaseClient({
      cvs: { data: { parsed_data: cvAnalysis, raw_text: 'raw cv text' }, error: null },
      skills: { data: [], error: null },
      job_preferences: { data: null, error: null },
    })
    const serviceClient = createFakeSupabaseClient(
      { jobs: { data: null, error: null }, job_matches: { data: null, error: null } },
      jobsCalls,
    )
    const provider = makeProvider()
    const job = { ...baseJob, ai_analysis: null }

    await computeAndSaveMatch({ userClient, serviceClient, provider, userId: 'user-1', job })

    expect(provider.analyzeJob).toHaveBeenCalledWith({
      title: 'Data Analyst',
      company: 'Acme',
      description: 'Analyze data',
      requirements: undefined,
    })
    const jobsUpdateCall = jobsCalls.find((c) => c.table === 'jobs' && c.method === 'update')
    expect(jobsUpdateCall?.args[0]).toEqual({ ai_analysis: jobAnalysis })
  })

  it('defaults userSkills, preferredLocations and remotePreference when the data is missing', async () => {
    const userClient = createFakeSupabaseClient({
      cvs: { data: { parsed_data: cvAnalysis, raw_text: null }, error: null },
      skills: { data: null, error: null },
      job_preferences: { data: null, error: null },
    })
    const serviceClient = createFakeSupabaseClient({ job_matches: { data: null, error: null } })
    const provider = makeProvider()
    const job = { ...baseJob, ai_analysis: jobAnalysis }

    await computeAndSaveMatch({ userClient, serviceClient, provider, userId: 'user-1', job })

    expect(provider.calculateMatch).toHaveBeenCalledWith(
      expect.objectContaining({
        cvRawText: '',
        userSkills: [],
        preferredLocations: [],
        remotePreference: 'any',
      }),
    )
  })

  it('ignores a non-array preferred_locations value instead of passing it through', async () => {
    const userClient = createFakeSupabaseClient({
      cvs: { data: { parsed_data: cvAnalysis, raw_text: '' }, error: null },
      skills: { data: [], error: null },
      job_preferences: { data: { preferred_locations: 'Dakar', remote_preference: 'any' }, error: null },
    })
    const serviceClient = createFakeSupabaseClient({ job_matches: { data: null, error: null } })
    const provider = makeProvider()
    const job = { ...baseJob, ai_analysis: jobAnalysis }

    await computeAndSaveMatch({ userClient, serviceClient, provider, userId: 'user-1', job })

    expect(provider.calculateMatch).toHaveBeenCalledWith(
      expect.objectContaining({ preferredLocations: [] }),
    )
  })

  it('throws when persisting the match fails, instead of swallowing the error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const userClient = createFakeSupabaseClient({
      cvs: { data: { parsed_data: cvAnalysis, raw_text: '' }, error: null },
      skills: { data: [], error: null },
      job_preferences: { data: null, error: null },
    })
    const serviceClient = createFakeSupabaseClient({
      job_matches: { data: null, error: new Error('db unreachable') },
    })
    const provider = makeProvider()
    const job = { ...baseJob, ai_analysis: jobAnalysis }

    await expect(
      computeAndSaveMatch({ userClient, serviceClient, provider, userId: 'user-1', job }),
    ).rejects.toThrow('db unreachable')

    vi.restoreAllMocks()
  })
})
