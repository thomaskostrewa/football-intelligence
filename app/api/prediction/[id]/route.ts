import { NextResponse } from 'next/server'
import { getMatchDataset } from '@/lib/match-view-model'
import { computePrediction, computeFactors } from '@/lib/prediction'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const dataset = await getMatchDataset(params.id)
  if (!dataset) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  const { match, homeTeam, awayTeam } = dataset
  const prediction = computePrediction(homeTeam.xgAvg, awayTeam.xgAvg)
  const factors = computeFactors(homeTeam, awayTeam, prediction, match.weather)

  return NextResponse.json({
    matchId: match.id,
    homeTeam: {
      id: homeTeam.id,
      code: homeTeam.code,
      flag: homeTeam.flag,
      name: homeTeam.name,
      xgAvg: homeTeam.xgAvg,
      goalsAgainstAvg: homeTeam.goalsAgainstAvg,
      form: homeTeam.form,
    },
    awayTeam: {
      id: awayTeam.id,
      code: awayTeam.code,
      flag: awayTeam.flag,
      name: awayTeam.name,
      xgAvg: awayTeam.xgAvg,
      goalsAgainstAvg: awayTeam.goalsAgainstAvg,
      form: awayTeam.form,
    },
    round: match.round,
    venue: match.venue,
    date: match.date,
    weather: match.weather,
    importance: match.importance,
    prediction: {
      matrix: prediction.matrix,
      topResults: prediction.topResults,
      homeWinProb: prediction.homeWinProb,
      drawProb: prediction.drawProb,
      awayWinProb: prediction.awayWinProb,
      mostLikelyResult: prediction.mostLikelyResult,
      lambdaHome: prediction.lambdaHome,
      lambdaAway: prediction.lambdaAway,
    },
    factors,
    fixtureSource: dataset.fixtureSource,
  })
}
