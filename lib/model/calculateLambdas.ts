import type { MatchModelInput } from './buildMatchModelInput'

export type LambdaResult = {
  lambdaHome: number
  lambdaAway: number
  sourceWeights: {
    odds: number
    apiFootball: number
    elo: number
    form: number
    weather: number
  }
  notes: string[]
}

type Signal = {
  source: keyof LambdaResult['sourceWeights']
  weight: number
  home: number
  away: number
  note: string
}

const TOURNAMENT_BASELINE_HOME = 1.32
const TOURNAMENT_BASELINE_AWAY = 1.12

function clampLambda(value: number) {
  return Math.max(0.2, Math.min(4, value))
}

function formScore(form?: string) {
  if (!form) return 0
  const values: number[] = form.split('').map(item => (item === 'W' ? 1 : item === 'D' ? 0 : -1))
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function oddsToGoals(input: MatchModelInput) {
  const odds = input.odds
  if (!odds?.homeWin || !odds.draw || !odds.awayWin) return null

  const totalGoals = odds.over25 ? 2.25 + odds.over25 * 1.1 : 2.45
  const homeEdge = odds.homeWin - odds.awayWin
  const drawDrag = Math.max(0, odds.draw - 0.26)
  const lambdaHome = totalGoals / 2 + homeEdge * 1.35 - drawDrag * 0.35
  const lambdaAway = totalGoals / 2 - homeEdge * 1.35 - drawDrag * 0.35

  return { home: clampLambda(lambdaHome), away: clampLambda(lambdaAway) }
}

function apiFootballGoals(input: MatchModelInput) {
  const api = input.apiFootball
  if (!api) return null
  const home = api.expectedGoalsHome
  const away = api.expectedGoalsAway
  if (home == null && away == null) return null
  return {
    home: clampLambda(home ?? input.fallback.homeXg),
    away: clampLambda(away ?? input.fallback.awayXg),
  }
}

function eloGoals(input: MatchModelInput) {
  if (!input.elo) return null
  const diff = input.elo.home - input.elo.away
  const goalDiff = diff / 420
  return {
    home: clampLambda(TOURNAMENT_BASELINE_HOME + goalDiff),
    away: clampLambda(TOURNAMENT_BASELINE_AWAY - goalDiff),
  }
}

function formGoals(input: MatchModelInput) {
  const homeForm = formScore(input.apiFootball?.formHome ?? input.fallback.homeForm)
  const awayForm = formScore(input.apiFootball?.formAway ?? input.fallback.awayForm)
  const modifier = (homeForm - awayForm) * 0.18
  return {
    home: clampLambda(input.fallback.homeXg + modifier),
    away: clampLambda(input.fallback.awayXg - modifier),
  }
}

function weatherFactor(input: MatchModelInput) {
  const weather = input.weather
  if (!weather) return 1

  let factor = 1
  if ((weather.windSpeed ?? 0) >= 30) factor -= 0.06
  if ((weather.rainProbability ?? 0) >= 60) factor -= 0.05
  if ((weather.temperature ?? 20) >= 32) factor -= 0.03
  if ((weather.humidity ?? 50) >= 85) factor -= 0.02
  return Math.max(0.86, Math.min(1.04, factor))
}

export function calculateLambdas(input: MatchModelInput): LambdaResult {
  const configuredWeights = input.availability.hasOdds
    ? { odds: 0.5, apiFootball: 0.3, elo: 0.15, form: 0.03, weather: 0.02 }
    : { odds: 0, apiFootball: 0.5, elo: 0.3, form: 0.15, weather: 0.05 }

  const signals: Signal[] = []
  const odds = oddsToGoals(input)
  if (odds) signals.push({ source: 'odds', weight: configuredWeights.odds, ...odds, note: 'Marktquoten setzen den kurzfristigen Erwartungsrahmen.' })

  const api = apiFootballGoals(input)
  if (api) signals.push({ source: 'apiFootball', weight: configuredWeights.apiFootball, ...api, note: 'API-Football liefert erwartete Tore und Prediction-Signale.' })

  const elo = eloGoals(input)
  if (elo) signals.push({ source: 'elo', weight: configuredWeights.elo, ...elo, note: 'Elo stabilisiert die Teamstaerke als Fallback-Anker.' })

  signals.push({ source: 'form', weight: configuredWeights.form || 0.15, ...formGoals(input), note: 'Aktuelle Form verschiebt die Torerwartung leicht.' })

  if (!signals.some(signal => signal.source !== 'form')) {
    signals.push({
      source: 'apiFootball',
      weight: 0.5,
      home: input.fallback.homeXg || TOURNAMENT_BASELINE_HOME,
      away: input.fallback.awayXg || TOURNAMENT_BASELINE_AWAY,
      note: 'Statischer Fallback verhindert einen Ausfall der Prognose.',
    })
  }

  const totalWeight = signals.reduce((sum, signal) => sum + signal.weight, 0) || 1
  const normalizedWeights = {
    odds: 0,
    apiFootball: 0,
    elo: 0,
    form: 0,
    weather: input.availability.hasWeather ? configuredWeights.weather : 0,
  }

  let lambdaHome = 0
  let lambdaAway = 0
  const notes: string[] = []

  for (const signal of signals) {
    const weight = signal.weight / totalWeight
    normalizedWeights[signal.source] += weight
    lambdaHome += signal.home * weight
    lambdaAway += signal.away * weight
    notes.push(signal.note)
  }

  const weather = weatherFactor(input)
  lambdaHome *= weather
  lambdaAway *= weather
  if (input.availability.hasWeather) notes.push(`Wetterfaktor wirkt mit ${(weather * 100).toFixed(0)}% auf beide Lambdas.`)
  else notes.push('Wetterdaten fehlen oder sind nur als Platzhalter vorhanden.')

  return {
    lambdaHome: clampLambda(lambdaHome),
    lambdaAway: clampLambda(lambdaAway),
    sourceWeights: normalizedWeights,
    notes: Array.from(new Set(notes)).slice(0, 5),
  }
}
