import { NextResponse } from 'next/server'
import matchesData from '@/data/matches.json'
import teamsData from '@/data/teams.json'
import { computePrediction } from '@/lib/prediction'
import { generateReasoning } from '@/lib/reasoning'
import { isValidLang, DEFAULT_LANG } from '@/lib/i18n'

type Match = {
  id: string; homeTeam: string; awayTeam: string
  weather: { icon: string; temp: number; desc: { de: string; en: string; pt: string } }
}
type Team = {
  id: string; name: { de: string; en: string; pt: string }
  xgAvg: number; goalsAgainstAvg: number; form: string[]
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url)
  const langParam = url.searchParams.get('lang') ?? DEFAULT_LANG
  const lang = isValidLang(langParam) ? langParam : DEFAULT_LANG

  const matches = matchesData as Match[]
  const teams = teamsData as Record<string, Team>
  const match = matches.find(m => m.id === params.id)
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

  const homeTeam = teams[match.homeTeam]
  const awayTeam = teams[match.awayTeam]
  const prediction = computePrediction(homeTeam.xgAvg, awayTeam.xgAvg)

  const text = await generateReasoning({
    homeTeam,
    awayTeam,
    prediction: prediction.mostLikelyResult,
    homeWinProb: prediction.homeWinProb,
    drawProb: prediction.drawProb,
    awayWinProb: prediction.awayWinProb,
    weather: match.weather,
    lang,
  })

  return NextResponse.json({ reasoning: text })
}
