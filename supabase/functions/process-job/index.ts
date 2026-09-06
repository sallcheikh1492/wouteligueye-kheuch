// POST /process-job  { title, company, location?, description?, requirements?,
//                       employment_type?, application_url? }
//
// Normalizes and inserts a single job posting. Used today for manual import
// by URL/fields (spec section 11: manual import is always allowed,
// regardless of connector availability) — the same entry point the
// automated discovery pipeline (discover-jobs) will call for each posting
// it finds once it ships.
//
// jobs is shared, non-user-owned data with no INSERT policy for regular
// users, so the write goes through the service role after validating input.
import { z } from 'npm:zod@3.23.8'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createServiceRoleClient, createUserClient } from '../_shared/supabaseClient.ts'

const inputSchema = z.object({
  title: z.string().trim().min(1).max(300),
  company: z.string().trim().min(1).max(300),
  location: z.string().trim().max(300).optional(),
  description: z.string().trim().max(20000).optional(),
  requirements: z.string().trim().max(20000).optional(),
  employment_type: z.enum(['full_time', 'part_time', 'contract', 'internship', 'freelance']).optional(),
  application_url: z.string().trim().url().optional(),
})

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

    const userClient = createUserClient(authHeader)
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()
    if (userError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400)
    }

    const parsed = inputSchema.safeParse(rawBody)
    if (!parsed.success) {
      return jsonResponse({ error: 'Champs invalides', details: parsed.error.flatten() }, 400)
    }
    const input = parsed.data

    const serviceClient = createServiceRoleClient()

    const { data: source, error: sourceError } = await serviceClient
      .from('job_sources')
      .select('id')
      .eq('name', 'Import manuel')
      .single()
    if (sourceError || !source) {
      console.error('Manual job source not found', sourceError)
      return jsonResponse({ error: "Source d'import manuel introuvable" }, 500)
    }

    const { data: job, error: insertError } = await serviceClient
      .from('jobs')
      .insert({
        source_id: source.id,
        title: input.title,
        company: input.company,
        location: input.location ?? null,
        description: input.description ?? null,
        requirements: input.requirements ?? null,
        employment_type: input.employment_type ?? null,
        application_url: input.application_url ?? null,
        status: 'active',
        published_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (insertError || !job) {
      console.error('Failed to insert manual job', insertError)
      return jsonResponse({ error: "Échec de l'enregistrement de l'offre" }, 500)
    }

    return jsonResponse({ job })
  } catch (error) {
    console.error('process-job failed', error)
    return jsonResponse({ error: "Erreur interne lors de l'import de l'offre" }, 500)
  }
})
