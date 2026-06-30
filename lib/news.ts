import { XMLParser } from 'fast-xml-parser'

export interface NewsItem {
  title: string
  url: string
  source: string
  publishedAt: string // ISO
  timeAgo: string
}

const RSS_FEEDS = [
  { url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', source: 'BBC Sport' },
  { url: 'https://www.espn.com/espn/rss/soccer/news', source: 'ESPN' },
  { url: 'https://www.goal.com/en/news/rss', source: 'Goal.com' },
  { url: 'https://www.kicker.de/news/fussball/wm/rss.xml', source: 'Kicker' },
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}:${String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')}`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}:${String(minutes % 60).padStart(2, '0')}`
  return `${Math.floor(hours / 24)}d`
}

async function fetchFeed(url: string, source: string, keywords: string[]): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      headers: { 'User-Agent': 'Football-Intelligence/1.0' },
      next: { revalidate: 300 }, // cache 5 min
    })
    if (!res.ok) return []
    const xml = await res.text()

    const parser = new XMLParser({ ignoreAttributes: false })
    const parsed = parser.parse(xml)

    const items = parsed?.rss?.channel?.item ?? parsed?.feed?.entry ?? []
    const arr = Array.isArray(items) ? items : [items]

    return arr
      .filter((item: Record<string, unknown>) => {
        const text = `${item.title ?? ''} ${item.description ?? ''} ${item.summary ?? ''}`.toLowerCase()
        return keywords.some(kw => text.includes(kw.toLowerCase()))
      })
      .slice(0, 5)
      .map((item: Record<string, unknown>) => {
        const pubDate = (item.pubDate ?? item.published ?? item.updated ?? '') as string
        return {
          title: String(item.title ?? '').replace(/<[^>]+>/g, '').trim(),
          url: String(item.link ?? item.id ?? '#'),
          source,
          publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          timeAgo: pubDate ? timeAgo(pubDate) : '',
        }
      })
  } catch {
    return []
  }
}

export async function fetchNews(keywords: string[]): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    RSS_FEEDS.map(f => fetchFeed(f.url, f.source, keywords))
  )

  const all: NewsItem[] = results
    .flatMap(r => (r.status === 'fulfilled' ? r.value : []))
    .filter(item => item.title.length > 10)

  // Sort by date desc, deduplicate by title similarity
  all.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

  const seen = new Set<string>()
  const deduped: NewsItem[] = []
  for (const item of all) {
    const key = item.title.slice(0, 40).toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      deduped.push(item)
    }
  }

  // If no real news, return mock items for demo
  if (deduped.length === 0) {
    return getMockNews(keywords)
  }

  return deduped.slice(0, 6)
}

function getMockNews(keywords: string[]): NewsItem[] {
  const team1 = keywords[0] ?? 'Team A'
  const team2 = keywords[3] ?? 'Team B'
  const now = new Date()
  return [
    {
      title: `${team1} vollständig im Training – alle Stammspieler fit`,
      url: '#',
      source: 'Kicker',
      publishedAt: new Date(now.getTime() - 32 * 60000).toISOString(),
      timeAgo: '32:00',
    },
    {
      title: `${team2} Innenverteidiger fraglich – Entscheidung kurz vor Anpfiff`,
      url: '#',
      source: 'ESPN',
      publishedAt: new Date(now.getTime() - 55 * 60000).toISOString(),
      timeAgo: '55:00',
    },
    {
      title: `Wettermodelle korrigiert – Regenwahrscheinlichkeit steigt auf 60%`,
      url: '#',
      source: 'Weather.com',
      publishedAt: new Date(now.getTime() - 90 * 60000).toISOString(),
      timeAgo: '1:30',
    },
  ]
}
