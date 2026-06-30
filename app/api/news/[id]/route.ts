import { NextResponse } from 'next/server'
import matchesData from '@/data/matches.json'
import teamsData from '@/data/teams.json'
import { fetchNews } from '@/lib/news'

type Match = { id: string; homeTeam: string; awayTeam: string }
type Team = { newsKeywords: string[] }

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const matches = matchesData as Match[]
  const teams = teamsData as Record<string, Team>
  const match = matches.find(m => m.id === params.id)
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

  const keywords = [
    ...(teams[match.homeTeam]?.newsKeywords ?? []),
    ...(teams[match.awayTeam]?.newsKeywords ?? []),
    'World Cup', 'Weltmeisterschaft', 'WM 2026',
  ]

  const news = await fetchNews(keywords)
  return NextResponse.json({ news }, { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate' } })
}
