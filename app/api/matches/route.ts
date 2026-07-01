import { NextResponse } from 'next/server'
import { getBaseTeams, getAllTeams, isResolvedMatch } from '@/lib/match-view-model'
import { getFixtureFeed } from '@/lib/fixtures/provider'

export const dynamic = 'force-dynamic'

export async function GET() {
  const baseTeams = getBaseTeams()
  const feed = await getFixtureFeed(baseTeams)
  const teams = getAllTeams(feed.teams)
  const matches = feed.matches.map(m => {
    const homeTeam = teams[m.homeTeam]
    const awayTeam = teams[m.awayTeam]

    return {
      id: m.id,
      providerId: m.providerId,
      provider: m.provider,
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
      resolved: isResolvedMatch(m, teams),
    }
  })

  return NextResponse.json({
    source: feed.source,
    matches,
  })
}
