// Generic RSS/Atom connector. RSS feeds are published by sites specifically
// for automated syndication — fetching one over HTTP is not scraping and
// doesn't touch any access control, so it needs no special authorization.
// This is deliberately the only built-in connector: it works with any job
// board or company career page that publishes a public feed, without
// hardcoding a specific third-party site whose current terms this codebase
// cannot verify at build time. Add a feed's URL as a job_sources row
// (type = 'rss_feed') to start pulling from it.
import Parser from 'npm:rss-parser@3.13.0'
import type { DiscoveredJob, JobSourceConnector } from './types.ts'

type FeedItem = {
  guid?: string
  link?: string
  title?: string
  contentSnippet?: string
  content?: string
  creator?: string
  isoDate?: string
  pubDate?: string
}

// Some job feeds format entries as "Company: Job title" (no dedicated
// company field in RSS) — split on the first colon when it looks like that
// convention, otherwise fall back to the feed-level author/title.
function splitTitleAndCompany(rawTitle: string, fallbackCompany: string): { title: string; company: string } {
  const match = rawTitle.match(/^([^:]{2,60}):\s*(.+)$/)
  if (match) {
    return { company: match[1].trim(), title: match[2].trim() }
  }
  return { title: rawTitle, company: fallbackCompany }
}

export class RssJobSourceConnector implements JobSourceConnector {
  readonly name = 'RSS Feed'

  async fetchJobs(source: { url: string | null }): Promise<DiscoveredJob[]> {
    if (!source.url) return []

    const parser = new Parser<Record<string, unknown>, FeedItem>()
    const feed = await parser.parseURL(source.url)
    const fallbackCompany = feed.title ?? 'Entreprise non précisée'

    return (feed.items ?? [])
      .filter((item): item is FeedItem & { link: string } => !!(item.link || item.guid))
      .map((item) => {
        const { title, company } = splitTitleAndCompany(item.title ?? 'Poste sans titre', item.creator ?? fallbackCompany)
        return {
          externalId: item.guid ?? item.link!,
          title,
          company,
          description: item.contentSnippet ?? item.content ?? undefined,
          applicationUrl: item.link ?? undefined,
          publishedAt: item.isoDate ?? item.pubDate ?? undefined,
        }
      })
  }
}
