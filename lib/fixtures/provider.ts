import seedMatches from '@/data/remaining-matches.json'
import { getWorldCupFixtures, type ApiFootballMatchData } from '@/lib/data-sources/apiFootball'
import type { MatchData, TeamData } from '@/lib/match-view-model'

type SportMonksParticipant = {
  id?: number
  name?: string
  short_code?: string | null
  image_path?: string | null
  meta?: {
    location?: 'home' | 'away'
  }
}

type SportMonksFixture = {
  id: number
  name?: string | null
  starting_at?: string | null
  placeholder?: boolean
  participants?: SportMonksParticipant[]
  round?: { name?: string | null } | null
  stage?: { name?: string | null } | null
  venue?: { name?: string | null; city_name?: string | null } | null
}

type SportMonksResponse = {
  data?: SportMonksFixture[]
}

export type FixtureSourceKind = 'sportmonks' | 'api-football-mapped' | 'seed-fallback'

export type FixtureSource = {
  kind: FixtureSourceKind
  name: string
  isLive: boolean
  configured: boolean
  generatedAt: string
  note: string
}

export type FixtureFeed = {
  matches: MatchData[]
  teams: Record<string, TeamData>
  source: FixtureSource
}

const providerTeamDefaults = {
  xgAvg: 1,
  goalsAgainstAvg: 1,
  form: ['D', 'D', 'D', 'D', 'D'],
}

function localized(value: string) {
  return { de: value, en: value, pt: value }
}

function toIsoDate(startingAt?: string | null) {
  if (!startingAt) return new Date().toISOString()
  return new Date(startingAt.replace(' ', 'T') + (startingAt.endsWith('Z') ? '' : 'Z')).toISOString()
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '')
}

function teamAliases(team: TeamData) {
  return [team.code, team.name.en, team.name.de, team.name.pt, ...team.newsKeywords]
    .filter(Boolean)
    .map(value => normalizeName(value))
}

function teamMatchesApiName(team: TeamData, apiName?: string) {
  if (!apiName) return false
  const normalizedApiName = normalizeName(apiName)
  return teamAliases(team).some(alias => alias === normalizedApiName || normalizedApiName.includes(alias) || alias.includes(normalizedApiName))
}

function datesAreClose(localDate: string, apiDate?: string) {
  if (!apiDate) return false
  const deltaMs = Math.abs(new Date(localDate).getTime() - new Date(apiDate).getTime())
  return deltaMs <= 48 * 60 * 60 * 1000
}

function findApiFootballFixture(
  match: MatchData,
  teams: Record<string, TeamData>,
  fixtures: ApiFootballMatchData[]
) {
  const homeTeam = teams[match.homeTeam]
  const awayTeam = teams[match.awayTeam]
  if (!homeTeam || !awayTeam) return undefined

  return fixtures.find(fixture => {
    const directOrder =
      teamMatchesApiName(homeTeam, fixture.homeTeam) &&
      teamMatchesApiName(awayTeam, fixture.awayTeam)
    const swappedOrder =
      teamMatchesApiName(homeTeam, fixture.awayTeam) &&
      teamMatchesApiName(awayTeam, fixture.homeTeam)

    return (directOrder || swappedOrder) && datesAreClose(match.date, fixture.kickoff)
  })
}

function withApiFootballFixtureIds(
  matches: MatchData[],
  teams: Record<string, TeamData>,
  fixtures: ApiFootballMatchData[]
) {
  let mappedCount = 0

  const mappedMatches = matches.map(match => {
    const fixture = findApiFootballFixture(match, teams, fixtures)
    if (!fixture?.fixtureId) return match

    mappedCount += 1

    return {
      ...match,
      provider: 'api-football',
      providerId: fixture.fixtureId,
      date: fixture.kickoff ?? match.date,
      venue: fixture.venue ? localized(fixture.venue) : match.venue,
    } satisfies MatchData
  })

  return { mappedMatches, mappedCount }
}

function resolveParticipant(
  participant: SportMonksParticipant | undefined,
  teams: Record<string, TeamData>,
  generatedTeams: Record<string, TeamData>
) {
  if (!participant) return 'provider-tbd'

  const code = participant.short_code?.toLowerCase()
  const byCode = Object.values(teams).find(team => team.code.toLowerCase() === code)
  if (byCode) return byCode.id

  const name = participant.name ?? `Team ${participant.id ?? 'TBD'}`
  const id = participant.id ? `sportmonks-${participant.id}` : slugify(name)

  generatedTeams[id] = {
    id,
    code: participant.short_code ?? 'TBD',
    flag: '',
    name: localized(name),
    ...providerTeamDefaults,
    newsKeywords: [name],
  }

  return id
}

function normalizeSportMonksFixtures(
  fixtures: SportMonksFixture[],
  teams: Record<string, TeamData>
) {
  const generatedTeams: Record<string, TeamData> = {}

  const matches = fixtures
    .filter(fixture => fixture.starting_at)
    .map(fixture => {
      const home = fixture.participants?.find(participant => participant.meta?.location === 'home')
      const away = fixture.participants?.find(participant => participant.meta?.location === 'away')
      const homeTeam = fixture.placeholder ? 'provider-tbd' : resolveParticipant(home, teams, generatedTeams)
      const awayTeam = fixture.placeholder ? 'provider-tbd' : resolveParticipant(away, teams, generatedTeams)
      const venue = [fixture.venue?.name, fixture.venue?.city_name].filter(Boolean).join(', ') || 'TBD'
      const round = fixture.round?.name ?? fixture.stage?.name ?? 'World Cup 2026'

      return {
        id: `sportmonks-${fixture.id}`,
        providerId: String(fixture.id),
        provider: 'sportmonks',
        round: localized(round),
        date: toIsoDate(fixture.starting_at),
        venue: localized(venue),
        homeTeam,
        awayTeam,
        weather: {
          icon: '⛅',
          temp: 0,
          desc: localized('Weather data pending'),
        },
        importance: localized('Knockout fixture from live provider data.'),
      } satisfies MatchData
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return { matches, teams: generatedTeams }
}

async function fetchSportMonksFixtures(teams: Record<string, TeamData>): Promise<FixtureFeed | null> {
  const token = process.env.SPORTMONKS_API_TOKEN
  const seasonId = process.env.SPORTMONKS_WORLD_CUP_SEASON_ID

  if (!token || !seasonId) return null

  const endpoint = new URL(process.env.SPORTMONKS_FIXTURES_URL ?? 'https://api.sportmonks.com/v3/football/fixtures')
  endpoint.searchParams.set('api_token', token)
  endpoint.searchParams.set('include', 'participants;stage;round;venue;state;scores;weatherReport;xGFixture')
  endpoint.searchParams.set('filters', `fixtureSeasons:${seasonId}`)
  endpoint.searchParams.set('per_page', '50')

  const response = await fetch(endpoint, {
    next: { revalidate: 300 },
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`SportMonks fixtures request failed with ${response.status}`)
  }

  const payload = (await response.json()) as SportMonksResponse
  const normalized = normalizeSportMonksFixtures(payload.data ?? [], teams)

  return {
    ...normalized,
    source: {
      kind: 'sportmonks',
      name: 'SportMonks Football API',
      isLive: true,
      configured: true,
      generatedAt: new Date().toISOString(),
      note: 'Live fixture data loaded from SportMonks.',
    },
  }
}

function getSeedFixtureFeed(): FixtureFeed {
  return {
    matches: seedMatches as MatchData[],
    teams: {},
    source: {
      kind: 'seed-fallback',
      name: 'Local fixture fallback',
      isLive: false,
      configured: false,
      generatedAt: new Date().toISOString(),
      note: 'SPORTMONKS_API_TOKEN and SPORTMONKS_WORLD_CUP_SEASON_ID are required for live fixtures.',
    },
  }
}

export async function getFixtureFeed(teams: Record<string, TeamData>): Promise<FixtureFeed> {
  try {
    const liveFeed = await fetchSportMonksFixtures(teams)
    if (liveFeed?.matches.length) return liveFeed
  } catch (error) {
    console.error(error)
  }

  const seedFeed = getSeedFixtureFeed()

  try {
    const apiFootballFixtures = await getWorldCupFixtures(2026)
    if (apiFootballFixtures.length) {
      const { mappedMatches, mappedCount } = withApiFootballFixtureIds(seedFeed.matches, teams, apiFootballFixtures)

      return {
        matches: mappedMatches,
        teams: seedFeed.teams,
        source: {
          kind: mappedCount > 0 ? 'api-football-mapped' : 'seed-fallback',
          name: mappedCount > 0 ? 'API-Football fixture mapping' : seedFeed.source.name,
          isLive: mappedCount > 0,
          configured: true,
          generatedAt: new Date().toISOString(),
          note:
            mappedCount > 0
              ? `${mappedCount} local fixtures matched to API-Football fixture IDs.`
              : 'API-Football is configured, but no local fixtures could be matched yet.',
        },
      }
    }
  } catch (error) {
    console.error('API-Football fixture mapping failed', error)
  }

  return {
    ...seedFeed,
    source: {
      ...seedFeed.source,
      configured: Boolean(process.env.API_FOOTBALL_KEY),
      note: process.env.API_FOOTBALL_KEY
        ? 'API-Football is configured, but no 2026 fixtures are available to this plan yet. Using local fallback fixtures.'
        : seedFeed.source.note,
    },
  }
}
