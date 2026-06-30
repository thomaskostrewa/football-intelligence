import { NextResponse } from 'next/server'
import matchesData from '@/data/matches.json'
import teamsData from '@/data/teams.json'

export const dynamic = 'force-static'

export function GET() {
  const teams = teamsData as Record<string, { id: string; name: { de: string; en: string; pt: string }; flag: string }>
  const matches = (matchesData as Array<{ id: string; homeTeam: string; awayTeam: string; date: string; round: { de: string; en: string; pt: string }; venue: { de: string; en: string; pt: string } }>).map(m => ({
    id: m.id,
    date: m.date,
    round: m.round,
    venue: m.venue,
    homeTeam: {
      id: m.homeTeam,
      name: teams[m.homeTeam]?.name,
      flag: teams[m.homeTeam]?.flag,
    },
    awayTeam: {
      id: m.awayTeam,
      name: teams[m.awayTeam]?.name,
      flag: teams[m.awayTeam]?.flag,
    },
  }))

  return NextResponse.json(matches)
}
