import matchesData from '@/data/matches.json'
import teamsData from '@/data/teams.json'
import { computeFactors, computePrediction } from '@/lib/prediction'
import { generateReasoning } from '@/lib/reasoning'
import { fetchNews } from '@/lib/news'
import type { Lang } from '@/lib/i18n'

export type LocalizedText = { de: string; en: string; pt: string }

export type MatchData = {
  id: string
  homeTeam: string
  awayTeam: string
  round: LocalizedText
  date: string
  venue: LocalizedText
  weather: {
    icon: string
    temp: number
    desc: LocalizedText
  }
  importance: LocalizedText
}

export type TeamData = {
  id: string
  code: string
  flag: string
  name: LocalizedText
  xgAvg: number
  goalsAgainstAvg: number
  form: string[]
  newsKeywords: string[]
}

export type MatchViewModel = {
  match: MatchData
  matches: MatchData[]
  teams: Record<string, TeamData>
  homeTeam: TeamData
  awayTeam: TeamData
  prediction: ReturnType<typeof computePrediction>
  factors: ReturnType<typeof computeFactors>
  reasoning: string
  news: Awaited<ReturnType<typeof fetchNews>>
  generatedAt: string
}

export function getStaticMatchParams() {
  const matches = matchesData as MatchData[]
  return matches.map(match => match.id)
}

export function getMatchDataset(matchId: string) {
  const matches = matchesData as MatchData[]
  const teams = teamsData as Record<string, TeamData>
  const match = matches.find(item => item.id === matchId)

  if (!match) return null

  const homeTeam = teams[match.homeTeam]
  const awayTeam = teams[match.awayTeam]

  if (!homeTeam || !awayTeam) return null

  return {
    match,
    matches,
    teams,
    homeTeam,
    awayTeam,
  }
}

export async function getMatchViewModel(matchId: string, lang: Lang): Promise<MatchViewModel | null> {
  const dataset = getMatchDataset(matchId)
  if (!dataset) return null

  const { match, homeTeam, awayTeam } = dataset
  const prediction = computePrediction(homeTeam.xgAvg, awayTeam.xgAvg)
  const factors = computeFactors(homeTeam, awayTeam, prediction, match.weather)

  const [reasoningResult, newsResult] = await Promise.allSettled([
    generateReasoning({
      homeTeam,
      awayTeam,
      prediction: prediction.mostLikelyResult,
      homeWinProb: prediction.homeWinProb,
      drawProb: prediction.drawProb,
      awayWinProb: prediction.awayWinProb,
      weather: match.weather,
      lang,
    }),
    fetchNews({
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
    }),
  ])

  return {
    ...dataset,
    prediction,
    factors,
    reasoning: reasoningResult.status === 'fulfilled' ? reasoningResult.value : '',
    news: newsResult.status === 'fulfilled' ? newsResult.value : [],
    generatedAt: new Date().toISOString(),
  }
}
