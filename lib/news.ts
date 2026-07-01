import { XMLParser } from 'fast-xml-parser'

export interface NewsItem {
  title: string
  url: string
  source: string
  publishedAt: string // ISO
  timeAgo: string
  relevanceScore?: number
  matchedKeywords?: string[]
}

type FetchNewsInput = string[] | {
  keywords: string[]
  requiredKeywords?: string[]
  limit?: number
}

const RSS_FEEDS = [
  { url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', source: 'BBC Sport' },
  { url: 'https://www.espn.com/espn/rss/soccer/news', source: 'ESPN' },
  { url: 'https://www.goal.com/en/news/rss', source: 'Goal.com' },
  { url: 'https://www.kicker.de/news/fussball/wm/rss.xml', source: 'Kicker' },
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.max(0, Math.floor(diff / 60000))
  if (minutes < 1) return 'gerade eben'
  if (minutes < 60) return `${minutes} Min.`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} Std.`
  return `${Math.floor(hours / 24)} Tg.`
}

function normalize(input: FetchNewsInput) {
  if (Array.isArray(input)) {
    return {
      keywords: input,
      requiredKeywords: input.filter(keyword => !/world cup|weltmeisterschaft|wm 2026/i.test(keyword)),
      limit: 6,
    }
  }

  return {
    keywords: input.keywords,
    requiredKeywords: input.requiredKeywords ?? input.keywords,
    limit: input.limit ?? 6,
  }
}

function keywordMatches(text: string, keywords: string[]) {
  const lower = text.toLowerCase()
  return keywords.filter(keyword => lower.includes(keyword.toLowerCase()))
}

function rankNews(items: NewsItem[], requiredKeywords: string[], limit: number): NewsItem[] {
  return items
    .map(item => {
      const text = `${item.title} ${item.source}`
      const matchedKeywords = keywordMatches(text, requiredKeywords)
      const sourceBoost = /kicker|espn|bbc|goal/i.test(item.source) ? 0.1 : 0
      const freshnessHours = Math.max(0, (Date.now() - new Date(item.publishedAt).getTime()) / 3600000)
      const freshnessScore = Math.max(0, 0.2 - freshnessHours / 120)
      const relevanceScore = Math.min(1, matchedKeywords.length * 0.3 + sourceBoost + freshnessScore)

      return {
        ...item,
        matchedKeywords,
        relevanceScore: Number(relevanceScore.toFixed(3)),
      }
    })
    .filter(item => item.matchedKeywords.length > 0)
    .sort(
      (a, b) =>
        (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0) ||
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    .slice(0, limit)
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

export async function fetchNews(input: FetchNewsInput): Promise<NewsItem[]> {
  const { keywords, requiredKeywords, limit } = normalize(input)
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

  const ranked = rankNews(deduped, requiredKeywords, limit)

  return ranked
}
