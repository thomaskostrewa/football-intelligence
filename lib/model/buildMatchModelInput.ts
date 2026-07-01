import { getFixtureLineupsWithHealth, getFixturePredictionWithHealth } from '@/lib/data-sources/apiFootball'
import { getSoccerOddsForMatchWithHealth } from '@/lib/data-sources/theOddsApi'
import { getOpenMeteoForecast } from '@/lib/data-sources/openMeteo'
import { getTeamEloRating } from '@/lib/data/teamEloRatings'
import { sourceHealth, type SourceHealth } from '@/lib/data-sources/health'
import type { MatchData, TeamData } from '@/lib/match-view-model'

export type MatchModelInput = {
  fixtureId: string
  homeTeam: string
  awayTeam: string
  kickoff: string
  venue?: string

  apiFootball?: {
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

  odds?: {
    homeWin?: number
    draw?: number
    awayWin?: number
    over25?: number
    under25?: number
    handicapHome?: number
  }

  elo?: {
    home: number
    away: number
  }

  weather?: {
    temperature?: number
    windSpeed?: number
    rainProbability?: number
    humidity?: number
  }

  fallback: {
    homeXg: number
    awayXg: number
    homeGoalsAgainst: number
    awayGoalsAgainst: number
    homeForm: string
    awayForm: string
  }

  availability: {
    hasApiFootball: boolean
    hasOdds: boolean
    hasElo: boolean
    hasWeather: boolean
    hasLineups: boolean
  }

  sourceHealth: {
    apiFootball: SourceHealth
    odds: SourceHealth
    elo: SourceHealth
    weather: SourceHealth
    lineups: SourceHealth
  }
}

function formToString(form: string[]) {
  return form.join('')
}

function hasRealWeather(match: MatchData) {
  const description = match.weather.desc.en.toLowerCase()
  return match.weather.temp > 0 && !description.includes('pending')
}

export async function buildMatchModelInput({
  match,
  homeTeam,
  awayTeam,
  refresh = false,
}: {
  match: MatchData
  homeTeam: TeamData
  awayTeam: TeamData
  refresh?: boolean
}): Promise<MatchModelInput> {
  const apiFootballFixtureId = match.provider === 'api-football' ? match.providerId : undefined

  const [apiFootballResult, oddsResult, openMeteo, lineupsResult] = await Promise.all([
    apiFootballFixtureId
      ? getFixturePredictionWithHealth(apiFootballFixtureId, refresh)
      : Promise.resolve({
          data: null,
          health: sourceHealth('fallback', 'Keine API-Football Fixture-ID verfuegbar. Lokale Fixtures und Fallback-Staerken werden genutzt.'),
        }),
    getSoccerOddsForMatchWithHealth(homeTeam.name.en, awayTeam.name.en, match.date, refresh),
    getOpenMeteoForecast(undefined, match.date, refresh),
    apiFootballFixtureId
      ? getFixtureLineupsWithHealth(apiFootballFixtureId, refresh)
      : Promise.resolve({
          data: null,
          health: sourceHealth('fallback', 'Lineups werden erst mit API-Football Fixture-ID abgefragt.'),
        }),
  ])

  const apiFootball = apiFootballResult.data
  const odds = oddsResult.data
  const lineups = lineupsResult.data
  const homeElo = getTeamEloRating(homeTeam)
  const awayElo = getTeamEloRating(awayTeam)
  const localWeather = hasRealWeather(match)
    ? {
        temperature: match.weather.temp,
      }
    : undefined

  return {
    fixtureId: match.id,
    homeTeam: homeTeam.name.de,
    awayTeam: awayTeam.name.de,
    kickoff: match.date,
    venue: match.venue.de,
    apiFootball: apiFootball ?? undefined,
    odds: odds ?? undefined,
    elo: homeElo && awayElo ? { home: homeElo, away: awayElo } : undefined,
    weather: openMeteo ?? localWeather,
    fallback: {
      homeXg: homeTeam.xgAvg,
      awayXg: awayTeam.xgAvg,
      homeGoalsAgainst: homeTeam.goalsAgainstAvg,
      awayGoalsAgainst: awayTeam.goalsAgainstAvg,
      homeForm: formToString(homeTeam.form),
      awayForm: formToString(awayTeam.form),
    },
    availability: {
      hasApiFootball: Boolean(apiFootball),
      hasOdds: Boolean(odds),
      hasElo: Boolean(homeElo && awayElo),
      hasWeather: Boolean(openMeteo ?? localWeather),
      hasLineups: Array.isArray(lineups) ? lineups.length > 0 : Boolean(lineups),
    },
    sourceHealth: {
      apiFootball: apiFootballResult.health,
      odds: oddsResult.health,
      elo: homeElo && awayElo
        ? sourceHealth('active', 'Elo-Fallback ist fuer beide Teams verfuegbar.')
        : sourceHealth('no-data', 'Elo-Fallback fehlt fuer mindestens ein Team.'),
      weather: openMeteo ?? localWeather
        ? sourceHealth('active', 'Wetterdaten wurden geladen oder lokal gepflegt.')
        : sourceHealth('no-data', 'Wetterdaten sind aktuell nicht verfuegbar.'),
      lineups: lineupsResult.health,
    },
  }
}
