// POST /generate-cover-letter  { job_id: string, tone?: 'formal'|'enthusiastic'|'concise' }
//
// Generates a cover letter from the caller's primary CV and a job posting,
// using only real information from the CV (never invented), and saves it as
// a generated_documents row. If an application already exists for this job
// and hasn't progressed past the early stages, it is bumped to
// "documents_ready" (spec section 16 workflow).
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createUserClient } from '../_shared/supabaseClient.ts'
import { AnthropicProvider } from '../_shared/ai/anthropic.ts'
import type { CVAnalysis } from '../_shared/ai/types.ts'

const EARLY_STATUSES = ['discovered', 'reviewing', 'interested']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing Authorization header' }, 401)
    }

    let body: { job_id?: unknown; tone?: unknown }
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400)
    }
    const jobId = body.job_id
    if (typeof jobId !== 'string' || !jobId) {
      return jsonResponse({ error: 'job_id is required' }, 400)
    }
    const tone = ['formal', 'enthusiastic', 'concise'].includes(body.tone as string)
      ? (body.tone as 'formal' | 'enthusiastic' | 'concise')
      : 'formal'

    const userClient = createUserClient(authHeader)
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()
    if (userError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const { data: job, error: jobError } = await userClient
      .from('jobs')
      .select('id, title, company, description')
      .eq('id', jobId)
      .single()
    if (jobError || !job) {
      return jsonResponse({ error: 'Job not found' }, 404)
    }

    const { data: cv, error: cvError } = await userClient
      .from('cvs')
      .select('id, parsed_data')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .maybeSingle()
    if (cvError) {
      console.error('Failed to load primary CV', cvError)
      return jsonResponse({ error: 'Impossible de charger votre CV principal' }, 500)
    }
    if (!cv || !cv.parsed_data) {
      return jsonResponse(
        { error: 'Analysez votre CV principal avant de générer une lettre de motivation' },
        422,
      )
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not configured')
      return jsonResponse({ error: "Le fournisseur IA n'est pas configuré" }, 500)
    }

    const provider = new AnthropicProvider(apiKey)

    const content = await provider.generateCoverLetter({
      cvAnalysis: cv.parsed_data as unknown as CVAnalysis,
      jobTitle: job.title,
      company: job.company,
      jobDescription: job.description ?? '',
      tone,
    })

    const { data: existingApplication } = await userClient
      .from('applications')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('job_id', jobId)
      .maybeSingle()

    const { data: document, error: documentError } = await userClient
      .from('generated_documents')
      .insert({
        user_id: user.id,
        job_id: jobId,
        application_id: existingApplication?.id ?? null,
        type: 'cover_letter',
        content,
        metadata: { tone },
      })
      .select()
      .single()
    if (documentError) {
      console.error('Failed to save cover letter', documentError)
      return jsonResponse({ error: "Échec de l'enregistrement de la lettre" }, 500)
    }

    if (existingApplication && EARLY_STATUSES.includes(existingApplication.status)) {
      // applications is user-owned (RLS allows the caller to update their own
      // rows directly) — no need for the service role here.
      const { error: statusError } = await userClient
        .from('applications')
        .update({ status: 'documents_ready' })
        .eq('id', existingApplication.id)
      if (statusError) console.error('Failed to update application status', statusError)
    }

    return jsonResponse({ content, document })
  } catch (error) {
    console.error('generate-cover-letter failed', error)
    return jsonResponse({ error: 'Erreur interne lors de la génération de la lettre' }, 500)
  }
})
