import eloRatings from '@/data/team-elo-ratings.json'

export type EloRating = {
  code: string
  rating: number
}

function normalize(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
}

const aliases: Record<string, string> = {
  england: 'ENG',
  eng: 'ENG',
  drcongo: 'COD',
  drkongo: 'COD',
  congo: 'COD',
  cod: 'COD',
  usa: 'USA',
  unitedstates: 'USA',
  bosniaandherzegovina: 'BIH',
  bosnienherzegowina: 'BIH',
  bih: 'BIH',
}

export function getTeamEloRating(team: { code?: string; name?: { de?: string; en?: string; pt?: string } }) {
  const ratings = eloRatings as Record<string, number>
  const candidates = [team.code, team.name?.en, team.name?.de, team.name?.pt].filter(Boolean) as string[]

  for (const candidate of candidates) {
    const direct = ratings[candidate.toUpperCase()]
    if (direct) return direct

    const alias = aliases[normalize(candidate)]
    if (alias && ratings[alias]) return ratings[alias]
  }

  return undefined
}
