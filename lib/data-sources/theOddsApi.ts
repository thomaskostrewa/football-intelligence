import { cached } from './cache'
import { sourceHealth, type SourceHealth } from './health'

const ODDS_BASE_URL = 'https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds'

type Outcome = {
  name: string
  price: number
}

type Market = {
  key: string
  outcomes: Outcome[]
}

type Bookmaker = {
  markets: Market[]
}

type OddsEvent = {
  home_team: string
  away_team: string
  commence_time: string
  bookmakers?: Bookmaker[]
}

export type OddsSignal = {
  homeWin?: number
  draw?: number
  awayWin?: number
  over25?: number
  under25?: number
}

type OddsSignalResult = {
  data: OddsSignal | null
  health: SourceHealth
}

function normalizeName(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
}

function average(values: number[]) {
  if (!values.length) return undefined
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function normalizeImplied(outcomes: Outcome[]) {
  const raw = outcomes
    .map(outcome => ({ name: outcome.name, probability: outcome.price > 0 ? 1 / outcome.price : 0 }))
    .filter(item => item.probability > 0)
  const total = raw.reduce((sum, item) => sum + item.probability, 0)
  if (!total) return []
  return raw.map(item => ({ name: item.name, probability: item.probability / total }))
}

function quotaFromHeaders(response: Response): SourceHealth['quota'] {
  const remaining = Number(response.headers.get('x-requests-remaining') ?? response.headers.get('x-credits-remaining'))
  const used = Number(response.headers.get('x-requests-used') ?? response.headers.get('x-credits-used'))
  return {
    remaining: Number.isFinite(remaining) ? remaining : undefined,
    used: Number.isFinite(used) ? used : undefined,
    period: 'month',
  }
}

export async function getSoccerOddsForMatchWithHealth(homeTeam: string, awayTeam: string, kickoff: string, refresh = false): Promise<OddsSignalResult> {
  const key = process.env.THE_ODDS_API_KEY
  if (!key) {
    return {
      data: null,
      health: sourceHealth('missing-key', 'The Odds API Key fehlt. Marktdaten werden ignoriert.'),
    }
  }

  const url = new URL(ODDS_BASE_URL)
  url.searchParams.set('apiKey', key)
  url.searchParams.set('regions', 'eu,uk,us')
  url.searchParams.set('markets', 'h2h,totals,spreads')
  url.searchParams.set('oddsFormat', 'decimal')

  const result = await cached(`the-odds-api:${homeTeam}:${awayTeam}:${kickoff}:detailed`, 20 * 60 * 1000, refresh, async () => {
    const response = await fetch(url, { headers: { Accept: 'application/json' } })
    const quota = quotaFromHeaders(response)

    if (!response.ok) {
      console.error(`The Odds API request failed with ${response.status}`)
      return {
        events: [] as OddsEvent[],
        health: sourceHealth(
          response.status === 429 || response.status === 402 ? 'limited' : 'error',
          response.status === 429 || response.status === 402
            ? 'The Odds API Kontingent ist erreicht oder der Plan erlaubt diese Anfrage nicht.'
            : `The Odds API Anfrage fehlgeschlagen (${response.status}).`,
          quota
        ),
      }
    }

    return {
      events: (await response.json()) as OddsEvent[],
      health: sourceHealth('active', 'The Odds API hat Marktdaten geliefert.', quota),
    }
  })

  const events = result.events
  const targetKickoff = new Date(kickoff).getTime()
  const home = normalizeName(homeTeam)
  const away = normalizeName(awayTeam)
  const event = events.find(item => {
    const namesMatch = normalizeName(item.home_team).includes(home) || normalizeName(item.away_team).includes(away)
    const timeDelta = Math.abs(new Date(item.commence_time).getTime() - targetKickoff)
    return namesMatch && timeDelta < 36 * 60 * 60 * 1000
  })

  if (!event?.bookmakers?.length) {
    return {
      data: null,
      health: result.health.status === 'active'
        ? sourceHealth('no-data', 'The Odds API liefert aktuell keine passenden Marktdaten fuer dieses Spiel.', result.health.quota)
        : result.health,
    }
  }

  const homeWin: number[] = []
  const draw: number[] = []
  const awayWin: number[] = []
  const over25: number[] = []
  const under25: number[] = []

  for (const bookmaker of event.bookmakers) {
    const h2h = bookmaker.markets.find(market => market.key === 'h2h')
    if (h2h) {
      for (const outcome of normalizeImplied(h2h.outcomes)) {
        const name = normalizeName(outcome.name)
        if (name === 'draw') draw.push(outcome.probability)
        else if (name.includes(home)) homeWin.push(outcome.probability)
        else if (name.includes(away)) awayWin.push(outcome.probability)
      }
    }

    const totals = bookmaker.markets.find(market => market.key === 'totals')
    if (totals) {
      for (const outcome of normalizeImplied(totals.outcomes)) {
        const name = normalizeName(outcome.name)
        if (name.includes('over')) over25.push(outcome.probability)
        if (name.includes('under')) under25.push(outcome.probability)
      }
    }
  }

  return {
    data: {
      homeWin: average(homeWin),
      draw: average(draw),
      awayWin: average(awayWin),
      over25: average(over25),
      under25: average(under25),
    },
    health: result.health,
  }
}

export async function getSoccerOddsForMatch(homeTeam: string, awayTeam: string, kickoff: string, refresh = false): Promise<OddsSignal | null> {
  const result = await getSoccerOddsForMatchWithHealth(homeTeam, awayTeam, kickoff, refresh)
  return result.data
}
