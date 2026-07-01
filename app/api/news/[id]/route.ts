import { NextResponse } from 'next/server'
import { fetchNews } from '@/lib/news'
import { getMatchDataset } from '@/lib/match-view-model'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const dataset = getMatchDataset(params.id)
  if (!dataset) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

  const { match, homeTeam, awayTeam } = dataset

  const news = await fetchNews({
    keywords: [
      ...homeTeam.newsKeywords,
      ...awayTeam.newsKeywords,
      match.venue.en,
      'World Cup',
      'Weltmeisterschaft',
      'WM 2026',
    ],
    requiredKeywords: [
      ...homeTeam.newsKeywords,
      ...awayTeam.newsKeywords,
      homeTeam.name.en,
      awayTeam.name.en,
      homeTeam.name.de,
      awayTeam.name.de,
      homeTeam.name.pt,
      awayTeam.name.pt,
    ],
    limit: 6,
  })
  return NextResponse.json({ news }, { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate' } })
}
