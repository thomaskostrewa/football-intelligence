import matchesData from '@/data/remaining-matches.json'
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
  isPlaceholder?: boolean
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

const additionalTeams: Record<string, TeamData> = {
  bih: {
    id: 'bih',
    code: 'BIH',
    flag: '🇧🇦',
    name: { de: 'Bosnien-Herzegowina', en: 'Bosnia and Herzegovina', pt: 'Bósnia e Herzegovina' },
    xgAvg: 1.1,
    goalsAgainstAvg: 1.25,
    form: ['W', 'D', 'W', 'L', 'D'],
    newsKeywords: ['Bosnia', 'Bosnien', 'Herzegovina'],
  },
  aut: {
    id: 'aut',
    code: 'AUT',
    flag: '🇦🇹',
    name: { de: 'Österreich', en: 'Austria', pt: 'Áustria' },
    xgAvg: 1.25,
    goalsAgainstAvg: 1.05,
    form: ['W', 'W', 'D', 'L', 'W'],
    newsKeywords: ['Austria', 'Österreich'],
  },
  alg: {
    id: 'alg',
    code: 'ALG',
    flag: '🇩🇿',
    name: { de: 'Algerien', en: 'Algeria', pt: 'Argélia' },
    xgAvg: 1.15,
    goalsAgainstAvg: 1.18,
    form: ['W', 'D', 'W', 'D', 'L'],
    newsKeywords: ['Algeria', 'Algerien'],
  },
  egy: {
    id: 'egy',
    code: 'EGY',
    flag: '🇪🇬',
    name: { de: 'Ägypten', en: 'Egypt', pt: 'Egito' },
    xgAvg: 1.18,
    goalsAgainstAvg: 1.15,
    form: ['W', 'D', 'W', 'L', 'W'],
    newsKeywords: ['Egypt', 'Ägypten', 'Salah'],
  },
  cpv: {
    id: 'cpv',
    code: 'CPV',
    flag: '🇨🇻',
    name: { de: 'Kap Verde', en: 'Cape Verde', pt: 'Cabo Verde' },
    xgAvg: 1.0,
    goalsAgainstAvg: 1.2,
    form: ['W', 'D', 'L', 'W', 'D'],
    newsKeywords: ['Cape Verde', 'Cabo Verde', 'Kap Verde'],
  },
  nor: {
    id: 'nor',
    code: 'NOR',
    flag: '🇳🇴',
    name: { de: 'Norwegen', en: 'Norway', pt: 'Noruega' },
    xgAvg: 1.55,
    goalsAgainstAvg: 1.05,
    form: ['W', 'W', 'D', 'W', 'L'],
    newsKeywords: ['Norway', 'Norwegen', 'Haaland', 'Odegaard'],
  },
  par: {
    id: 'par',
    code: 'PAR',
    flag: '🇵🇾',
    name: { de: 'Paraguay', en: 'Paraguay', pt: 'Paraguai' },
    xgAvg: 1.08,
    goalsAgainstAvg: 1.16,
    form: ['W', 'D', 'W', 'L', 'W'],
    newsKeywords: ['Paraguay'],
  },
}

const placeholderLabels: Record<string, LocalizedText> = {
  'w-eng-cod': { de: 'Sieger England/DR Kongo', en: 'Winner England/DR Congo', pt: 'Vencedor Inglaterra/RD Congo' },
  'w-bel-sen': { de: 'Sieger Belgien/Senegal', en: 'Winner Belgium/Senegal', pt: 'Vencedor Bélgica/Senegal' },
  'w-usa-bih': { de: 'Sieger USA/Bosnien-Herzegowina', en: 'Winner USA/Bosnia and Herzegovina', pt: 'Vencedor EUA/Bósnia e Herzegovina' },
  'w-esp-aut': { de: 'Sieger Spanien/Österreich', en: 'Winner Spain/Austria', pt: 'Vencedor Espanha/Áustria' },
  'w-por-cro': { de: 'Sieger Portugal/Kroatien', en: 'Winner Portugal/Croatia', pt: 'Vencedor Portugal/Croácia' },
  'w-sui-alg': { de: 'Sieger Schweiz/Algerien', en: 'Winner Switzerland/Algeria', pt: 'Vencedor Suíça/Argélia' },
  'w-aus-egy': { de: 'Sieger Australien/Ägypten', en: 'Winner Australia/Egypt', pt: 'Vencedor Austrália/Egito' },
  'w-arg-cpv': { de: 'Sieger Argentinien/Kap Verde', en: 'Winner Argentina/Cape Verde', pt: 'Vencedor Argentina/Cabo Verde' },
  'w-col-gha': { de: 'Sieger Kolumbien/Ghana', en: 'Winner Colombia/Ghana', pt: 'Vencedor Colômbia/Gana' },
  'w-can-mar-bra-nor': { de: 'Sieger CAN/MAR oder BRA/NOR', en: 'Winner CAN/MAR or BRA/NOR', pt: 'Vencedor CAN/MAR ou BRA/NOR' },
  'w-fra-par-mex-path': { de: 'Sieger FRA/PAR oder MEX/Pfad', en: 'Winner FRA/PAR or MEX path', pt: 'Vencedor FRA/PAR ou caminho MEX' },
  'w-r16-lower-1': { de: 'Sieger Achtelfinale 5', en: 'Winner round of 16 match 5', pt: 'Vencedor oitavos 5' },
  'w-r16-lower-2': { de: 'Sieger Achtelfinale 6', en: 'Winner round of 16 match 6', pt: 'Vencedor oitavos 6' },
  'w-r16-lower-3': { de: 'Sieger Achtelfinale 7', en: 'Winner round of 16 match 7', pt: 'Vencedor oitavos 7' },
  'w-r16-lower-4': { de: 'Sieger Achtelfinale 8', en: 'Winner round of 16 match 8', pt: 'Vencedor oitavos 8' },
  'w-r16-lower-5': { de: 'Sieger Achtelfinale offen', en: 'Winner pending round of 16', pt: 'Vencedor oitavos pendente' },
  'w-r16-lower-6': { de: 'Sieger Achtelfinale offen', en: 'Winner pending round of 16', pt: 'Vencedor oitavos pendente' },
  'w-qf-1': { de: 'Sieger Viertelfinale 1', en: 'Winner quarterfinal 1', pt: 'Vencedor quartos 1' },
  'w-qf-2': { de: 'Sieger Viertelfinale 2', en: 'Winner quarterfinal 2', pt: 'Vencedor quartos 2' },
  'w-qf-3': { de: 'Sieger Viertelfinale 3', en: 'Winner quarterfinal 3', pt: 'Vencedor quartos 3' },
  'w-qf-4': { de: 'Sieger Viertelfinale 4', en: 'Winner quarterfinal 4', pt: 'Vencedor quartos 4' },
  'l-sf-1': { de: 'Verlierer Halbfinale 1', en: 'Loser semifinal 1', pt: 'Perdedor meia-final 1' },
  'l-sf-2': { de: 'Verlierer Halbfinale 2', en: 'Loser semifinal 2', pt: 'Perdedor meia-final 2' },
  'w-sf-1': { de: 'Sieger Halbfinale 1', en: 'Winner semifinal 1', pt: 'Vencedor meia-final 1' },
  'w-sf-2': { de: 'Sieger Halbfinale 2', en: 'Winner semifinal 2', pt: 'Vencedor meia-final 2' },
}

function createPlaceholderTeam(id: string): TeamData {
  return {
    id,
    code: 'TBD',
    flag: '—',
    name: placeholderLabels[id] ?? { de: 'Noch offen', en: 'To be determined', pt: 'A definir' },
    xgAvg: 1,
    goalsAgainstAvg: 1,
    form: ['D', 'D', 'D', 'D', 'D'],
    newsKeywords: [],
    isPlaceholder: true,
  }
}

export function getAllTeams() {
  const placeholders = Object.fromEntries(
    Object.keys(placeholderLabels).map(id => [id, createPlaceholderTeam(id)])
  ) as Record<string, TeamData>

  return { ...(teamsData as Record<string, TeamData>), ...additionalTeams, ...placeholders }
}

export function isResolvedMatch(match: MatchData, teams: Record<string, TeamData>) {
  return Boolean(teams[match.homeTeam] && teams[match.awayTeam])
}

export function getStaticMatchParams() {
  const matches = matchesData as MatchData[]
  const teams = getAllTeams()
  return matches.filter(match => isResolvedMatch(match, teams)).map(match => match.id)
}

export function getMatchDataset(matchId: string) {
  const matches = matchesData as MatchData[]
  const teams = getAllTeams()
  const match = matches.find(item => item.id === matchId)

  if (!match) return null

  const homeTeam = teams[match.homeTeam]
  const awayTeam = teams[match.awayTeam]

  if (homeTeam.isPlaceholder || awayTeam.isPlaceholder) return null

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
