import { NextResponse } from 'next/server'
import { getMatchDataset } from '@/lib/match-view-model'
import { buildMatchIntelligence } from '@/lib/model/matchIntelligence'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: { fixtureId: string } }) {
  const dataset = await getMatchDataset(params.fixtureId)
  if (!dataset) {
    return NextResponse.json({ error: 'MATCH_NOT_FOUND', message: 'Match not found' }, { status: 404 })
  }

  const url = new URL(request.url)
  const refresh = url.searchParams.get('refresh') === 'true'

  try {
    const intelligence = await buildMatchIntelligence({
      match: dataset.match,
      homeTeam: dataset.homeTeam,
      awayTeam: dataset.awayTeam,
      refresh,
    })

    return NextResponse.json(intelligence)
  } catch (error) {
    console.error('Match intelligence route failed', error)
    return NextResponse.json(
      { error: 'MATCH_INTELLIGENCE_FAILED', message: 'Match intelligence could not be generated' },
      { status: 500 }
    )
  }
}
