import { NextResponse } from 'next/server'
import matchesData from '@/data/matches.json'
import teamsData from '@/data/teams.json'
import { computePrediction, computeFactors } from '@/lib/prediction'

type Match = {
  id: string
  homeTeam: string
  awayTeam: string
  weather: { icon: string; temp: number; desc: { de: string; en: string; pt: string } }
  importance: { de: string; en: string; pt: string }
  round: { de: string; en: string; pt: string }
  venue: { de: string; en: string; pt: string }
  date: string
}

type Team = {
  id: string
  code: string
  flag: string
  name: { de: string; en: string; pt: string }
  xgAvg: number
  goalsAgainstAvg: number
  form: string[]
  newsKeywords: string[]
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const matches = matchesData as Match[]
  const teams = teamsData as Record<string, Team>

  const match = matches.find(m => m.id === params.id)
  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  const homeTeam = teams[match.homeTeam]
  const awayTeam = teams[match.awayTeam]

  if (!homeTeam || !awayTeam) {
    return NextResponse.json({ error: 'Team data missing' }, { status: 500 })
  }

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
  })
}
