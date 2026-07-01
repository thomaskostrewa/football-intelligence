import { NextResponse } from 'next/server'
import matchesData from '@/data/remaining-matches.json'
import { getAllTeams, getMatchDataset } from '@/lib/match-view-model'

export const dynamic = 'force-static'

export function GET() {
  const teams = getAllTeams()
  const matches = (matchesData as Array<{ id: string; homeTeam: string; awayTeam: string; date: string; round: { de: string; en: string; pt: string }; venue: { de: string; en: string; pt: string } }>).map(m => {
    const dataset = getMatchDataset(m.id)
    const homeTeam = dataset?.homeTeam ?? teams[m.homeTeam]
    const awayTeam = dataset?.awayTeam ?? teams[m.awayTeam]

    return {
      id: m.id,
      date: m.date,
      round: m.round,
      venue: m.venue,
      homeTeam: {
        id: m.homeTeam,
        name: homeTeam?.name,
        flag: homeTeam?.flag,
      },
      awayTeam: {
        id: m.awayTeam,
        name: awayTeam?.name,
        flag: awayTeam?.flag,
      },
      resolved: Boolean(dataset),
    }
  })

  return NextResponse.json(matches)
}
