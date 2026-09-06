// POST /analyze-cv  { cv_id: string }
//
// Downloads the CV file from Storage (scoped to the caller via their own
// JWT — RLS guarantees they can only reach their own files and cvs row),
// extracts its text, sends it to the configured AIProvider for structured
// extraction, and persists the result on the cvs row.
import { extractText, getDocumentProxy } from 'npm:unpdf@0.11.0'
import mammoth from 'npm:mammoth@1.8.0'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createUserClient } from '../_shared/supabaseClient.ts'
import { AnthropicProvider } from '../_shared/ai/anthropic.ts'

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

    let body: { cv_id?: unknown }
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400)
    }
    const cv_id = body.cv_id
    if (typeof cv_id !== 'string' || !cv_id) {
      return jsonResponse({ error: 'cv_id is required' }, 400)
    }

    const supabase = createUserClient(authHeader)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const { data: cv, error: cvError } = await supabase
      .from('cvs')
      .select('*')
      .eq('id', cv_id)
      .single()
    if (cvError || !cv) {
      return jsonResponse({ error: 'CV not found' }, 404)
    }

    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from('cvs')
      .download(cv.file_url)
    if (downloadError || !fileBlob) {
      console.error('Failed to download CV file', downloadError)
      return jsonResponse({ error: 'Unable to download CV file' }, 500)
    }

    const arrayBuffer = await fileBlob.arrayBuffer()

    let rawText: string
    if (cv.file_type.includes('pdf')) {
      const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer))
      const { text } = await extractText(pdf, { mergePages: true })
      rawText = text
    } else if (cv.file_type.includes('word') || cv.file_type.includes('officedocument')) {
      const result = await mammoth.extractRawText({ arrayBuffer })
      rawText = result.value
    } else {
      return jsonResponse({ error: `Unsupported file type: ${cv.file_type}` }, 400)
    }

    rawText = rawText.trim()
    if (!rawText) {
      return jsonResponse({ error: "Aucun texte n'a pu être extrait de ce fichier" }, 422)
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not configured')
      return jsonResponse({ error: "Le fournisseur IA n'est pas configuré" }, 500)
    }

    const provider = new AnthropicProvider(apiKey)
    const analysis = await provider.analyzeCV({ rawText })

    const { error: updateError } = await supabase
      .from('cvs')
      .update({ raw_text: rawText, parsed_data: analysis })
      .eq('id', cv_id)

    if (updateError) {
      console.error('Failed to persist CV analysis', updateError)
      return jsonResponse({ error: "Échec de l'enregistrement de l'analyse" }, 500)
    }

    return jsonResponse({ analysis })
  } catch (error) {
    console.error('analyze-cv failed', error)
    return jsonResponse({ error: "Erreur interne lors de l'analyse du CV" }, 500)
  }
})
