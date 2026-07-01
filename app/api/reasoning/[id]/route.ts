import { NextResponse } from 'next/server'
import { computePrediction } from '@/lib/prediction'
import { generateReasoning } from '@/lib/reasoning'
import { isValidLang, DEFAULT_LANG } from '@/lib/i18n'
import { getMatchDataset } from '@/lib/match-view-model'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url)
  const langParam = url.searchParams.get('lang') ?? DEFAULT_LANG
  const lang = isValidLang(langParam) ? langParam : DEFAULT_LANG

  const dataset = getMatchDataset(params.id)
  if (!dataset) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

  const { match, homeTeam, awayTeam } = dataset
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
