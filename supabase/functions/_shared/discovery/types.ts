// Connector architecture for job discovery (spec section 11). New sources
// are added by implementing this interface — never by scraping a site that
// doesn't offer a legitimate feed/API, bypassing CAPTCHAs, or automating a
// login the platform doesn't allow.
export type DiscoveredJob = {
  externalId: string
  title: string
  company: string
  location?: string
  description?: string
  applicationUrl?: string
  publishedAt?: string
}

export interface JobSourceConnector {
  readonly name: string
  fetchJobs(source: { url: string | null }): Promise<DiscoveredJob[]>
}
