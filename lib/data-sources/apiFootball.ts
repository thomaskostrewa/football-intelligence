import { cached } from './cache'
import { sourceHealth, type SourceHealth } from './health'

const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io'

type ApiFootballResponse<T> = {
  response?: T
  errors?: unknown
}

type ApiFootballFetchResult<T> = {
  data: T | null
  health: SourceHealth
}

type ApiFootballFixture = {
  fixture?: {
    id?: number
    date?: string
    venue?: { name?: string; city?: string }
  }
  league?: { id?: number; season?: number }
  teams?: {
    home?: { id?: number; name?: string }
    away?: { id?: number; name?: string }
  }
}

type ApiFootballPrediction = {
  predictions?: {
    winner?: { id?: number | null; name?: string | null }
    percent?: { home?: string; draw?: string; away?: string }
    goals?: { home?: string; away?: string }
  }
  teams?: {
    home?: {
      id?: number
      name?: string
      last_5?: { form?: string; att?: string; def?: string; goals?: { for?: { average?: string }; against?: { average?: string } } }
    }
    away?: {
      id?: number
      name?: string
      last_5?: { form?: string; att?: string; def?: string; goals?: { for?: { average?: string }; against?: { average?: string } } }
    }
  }
}

export type ApiFootballMatchData = {
  fixtureId?: string
  leagueId?: number
  homeTeamId?: number
  awayTeamId?: number
  homeTeam?: string
  awayTeam?: string
  kickoff?: string
  venue?: string
}

export type ApiFootballPredictionData = {
  homeWinPercent?: number
  drawPercent?: number
  awayWinPercent?: number
  expectedGoalsHome?: number
  expectedGoalsAway?: number
  formHome?: string
  formAway?: string
  attackHome?: number
  defenseHome?: number
  attackAway?: number
  defenseAway?: number
}

function getKey() {
  return process.env.API_FOOTBALL_KEY
}

function parsePercent(value?: string) {
  if (!value) return undefined
  const parsed = Number(value.replace('%', '').trim())
  return Number.isFinite(parsed) ? parsed / 100 : undefined
}

function parseNumber(value?: string) {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function classifyApiFootballErrors(errors: unknown) {
  const text = typeof errors === 'string' ? errors : JSON.stringify(errors ?? {})
  if (!text || text === '{}') return null
  if (/plan|subscription|access/i.test(text)) return sourceHealth('blocked', 'API-Football liefert fuer diesen Plan keine Daten fuer diese Anfrage.')
  if (/quota|limit|requests/i.test(text)) return sourceHealth('limited', 'API-Football Kontingent oder Rate Limit erreicht.')
  return sourceHealth('error', 'API-Football hat einen Fehler fuer diese Anfrage gemeldet.')
}

async function apiFootballFetchDetailed<T>(
  path: string,
  params: Record<string, string | number>,
  refresh = false,
  ttlMs = 6 * 60 * 60 * 1000
): Promise<ApiFootballFetchResult<T>> {
  const key = getKey()
  if (!key) {
    return {
      data: null,
      health: sourceHealth('missing-key', 'API-Football Key fehlt. Fallback-Daten werden genutzt.'),
    }
  }

  const url = new URL(`${API_FOOTBALL_BASE_URL}${path}`)
  Object.entries(params).forEach(([name, value]) => url.searchParams.set(name, String(value)))

  return cached(`api-football:${url.toString()}:detailed`, ttlMs, refresh, async () => {
    const response = await fetch(url, {
      headers: {
        'x-apisports-key': key,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`API-Football request failed: ${path} ${response.status}`)
      return {
        data: null,
        health: sourceHealth(response.status === 429 ? 'limited' : 'error', `API-Football Anfrage fehlgeschlagen (${response.status}).`),
      }
    }

    const payload = (await response.json()) as ApiFootballResponse<T>
    const errors = payload.errors && Object.keys(payload.errors as Record<string, unknown>).length > 0
      ? classifyApiFootballErrors(payload.errors)
      : null

    if (errors) {
      console.error(`API-Football returned errors for ${path}`)
      return { data: null, health: errors }
    }

    const data = payload.response ?? null
    return {
      data,
      health: data ? sourceHealth('active', 'API-Football Daten wurden erfolgreich geladen.') : sourceHealth('no-data', 'API-Football liefert aktuell keine Daten fuer diese Anfrage.'),
    }
  })
}

async function apiFootballFetch<T>(path: string, params: Record<string, string | number>, refresh = false, ttlMs = 6 * 60 * 60 * 1000) {
  const result = await apiFootballFetchDetailed<T>(path, params, refresh, ttlMs)
  return result.data
}

export async function getWorldCupFixtures(season = 2026, refresh = false) {
  const fixtures = await apiFootballFetch<ApiFootballFixture[]>('/fixtures', { league: 1, season }, refresh)
  return (fixtures ?? []).map(fixture => ({
    fixtureId: fixture.fixture?.id ? String(fixture.fixture.id) : undefined,
    leagueId: fixture.league?.id,
    homeTeamId: fixture.teams?.home?.id,
    awayTeamId: fixture.teams?.away?.id,
    homeTeam: fixture.teams?.home?.name,
    awayTeam: fixture.teams?.away?.name,
    kickoff: fixture.fixture?.date,
    venue: [fixture.fixture?.venue?.name, fixture.fixture?.venue?.city].filter(Boolean).join(', ') || undefined,
  })) satisfies ApiFootballMatchData[]
}

export async function getFixturePrediction(fixtureId: string, refresh = false): Promise<ApiFootballPredictionData | null> {
  const result = await getFixturePredictionWithHealth(fixtureId, refresh)
  return result.data
}

export async function getFixturePredictionWithHealth(fixtureId: string, refresh = false): Promise<ApiFootballFetchResult<ApiFootballPredictionData>> {
  const result = await apiFootballFetchDetailed<ApiFootballPrediction[]>('/predictions', { fixture: fixtureId }, refresh, 30 * 60 * 1000)
  const predictions = result.data
  const prediction = predictions?.[0]
  if (!prediction) return { data: null, health: result.health.status === 'active' ? sourceHealth('no-data', 'API-Football liefert fuer dieses Spiel keine Prediction.') : result.health }

  return {
    data: {
      homeWinPercent: parsePercent(prediction.predictions?.percent?.home),
      drawPercent: parsePercent(prediction.predictions?.percent?.draw),
      awayWinPercent: parsePercent(prediction.predictions?.percent?.away),
      expectedGoalsHome: parseNumber(prediction.predictions?.goals?.home) ?? parseNumber(prediction.teams?.home?.last_5?.goals?.for?.average),
      expectedGoalsAway: parseNumber(prediction.predictions?.goals?.away) ?? parseNumber(prediction.teams?.away?.last_5?.goals?.for?.average),
      formHome: prediction.teams?.home?.last_5?.form,
      formAway: prediction.teams?.away?.last_5?.form,
      attackHome: parseNumber(prediction.teams?.home?.last_5?.att),
      defenseHome: parseNumber(prediction.teams?.home?.last_5?.def),
      attackAway: parseNumber(prediction.teams?.away?.last_5?.att),
      defenseAway: parseNumber(prediction.teams?.away?.last_5?.def),
    },
    health: sourceHealth('active', 'API-Football Prediction wurde erfolgreich geladen.'),
  }
}

export async function getFixtureOdds(fixtureId: string, refresh = false) {
  return apiFootballFetch('/odds', { fixture: fixtureId }, refresh, 30 * 60 * 1000)
}

export async function getFixtureLineups(fixtureId: string, refresh = false) {
  return apiFootballFetch('/fixtures/lineups', { fixture: fixtureId }, refresh, 10 * 60 * 1000)
}

export async function getFixtureLineupsWithHealth(fixtureId: string, refresh = false) {
  return apiFootballFetchDetailed('/fixtures/lineups', { fixture: fixtureId }, refresh, 10 * 60 * 1000)
}

export async function getTeamStatistics(teamId: number, leagueId: number, season = 2026, refresh = false) {
  return apiFootballFetch('/teams/statistics', { team: teamId, league: leagueId, season }, refresh)
}
