// Uses OpenAI's built-in web_search tool to find real, currently-listed
// public job postings matching a user's preferences. This is a genuine web
// search (a legitimate, publicly-offered capability) — not scraping: it
// never bypasses access controls, CAPTCHAs, or a site's own restrictions,
// consistent with the connector philosophy in rssConnector.ts. It
// complements the RSS connector for users who opt in
// (job_preferences.web_search_enabled), surfacing postings outside their
// configured feeds.
import type { DiscoveredJob } from './types.ts'
import { webSearchResultsSchema } from '../ai/validation.ts'

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'
const DEFAULT_MODEL = 'gpt-4.1'
const MAX_RESULTS = 15

type OpenAIResponse = {
  output_text?: string
  output?: { type: string; content?: { type: string; text?: string }[] }[]
}

function extractOutputText(data: OpenAIResponse): string | null {
  if (typeof data.output_text === 'string') return data.output_text
  for (const item of data.output ?? []) {
    if (item.type !== 'message') continue
    const textPart = item.content?.find((c) => c.type === 'output_text')
    if (textPart?.text) return textPart.text
  }
  return null
}

// The model is asked to answer with prose plus a fenced JSON block (rather
// than a forced structured-output schema, which is unreliable to combine
// with a search tool) — extract the first well-formed JSON array from it.
function extractJsonArray(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/i)
  const candidate = fenced ? fenced[1] : text.slice(text.indexOf('['), text.lastIndexOf(']') + 1)
  return JSON.parse(candidate)
}

export async function searchJobsViaOpenAI(params: {
  apiKey: string
  desiredTitles: string[]
  preferredLocations: string[]
  keywords: string[]
  model?: string
}): Promise<DiscoveredJob[]> {
  const { apiKey, desiredTitles, preferredLocations, keywords, model = DEFAULT_MODEL } = params
  if (desiredTitles.length === 0) return []

  const criteria = [
    `Postes recherchés : ${desiredTitles.join(', ')}`,
    preferredLocations.length ? `Localisations préférées : ${preferredLocations.join(', ')}` : null,
    keywords.length ? `Mots-clés : ${keywords.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      tools: [{ type: 'web_search' }],
      input:
        "Cherche sur le web des offres d'emploi RÉELLES, publiques et actuellement ouvertes " +
        `correspondant à ces critères :\n${criteria}\n\n` +
        `Renvoie au maximum ${MAX_RESULTS} offres, uniquement des postes que tu as réellement ` +
        "trouvés via la recherche web, avec une URL de candidature réelle et fonctionnelle. " +
        "N'invente JAMAIS une offre ou une URL — si tu n'es pas certain qu'une offre existe " +
        "réellement, ne l'inclus pas.\n\n" +
        'Termine ta réponse par UNIQUEMENT un bloc JSON (```json ... ```) contenant un tableau ' +
        "d'objets avec exactement ces champs : title, company, location, description, " +
        'application_url, published_at (chaîne ISO 8601 ou null si inconnue).',
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`OpenAI API error (${response.status}): ${body}`)
  }

  const data = (await response.json()) as OpenAIResponse
  const outputText = extractOutputText(data)
  if (!outputText) return []

  let parsed: unknown
  try {
    parsed = extractJsonArray(outputText)
  } catch {
    return []
  }

  const result = webSearchResultsSchema.safeParse(parsed)
  if (!result.success) return []

  return result.data.map((job) => ({
    externalId: job.application_url,
    title: job.title,
    company: job.company,
    location: job.location ?? undefined,
    description: job.description ?? undefined,
    applicationUrl: job.application_url,
    publishedAt: job.published_at ?? undefined,
  }))
}
