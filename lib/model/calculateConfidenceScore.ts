import type { MatchModelInput } from './buildMatchModelInput'

export type ConfidenceScore = {
  score: number
  label: 'Niedrig' | 'Mittel' | 'Hoch'
  reasons: string[]
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function calculateConfidenceScore(input: MatchModelInput): ConfidenceScore {
  let score = 30
  const reasons: string[] = ['Basiswert fuer Turniermodell: +30']

  if (input.availability.hasOdds) {
    score += 25
    reasons.push('Marktquoten verfuegbar: +25')
  }
  if (input.availability.hasApiFootball) {
    score += 20
    reasons.push('API-Football Prediction verfuegbar: +20')
  }
  if (input.availability.hasElo) {
    score += 15
    reasons.push('Elo-Staerkeanker verfuegbar: +15')
  }
  if (input.availability.hasWeather) {
    score += 10
    reasons.push('Wetterdaten verfuegbar: +10')
  }
  if (input.availability.hasLineups) {
    score += 10
    reasons.push('Lineups verfuegbar: +10')
  }

  const kickoffDeltaHours = (new Date(input.kickoff).getTime() - Date.now()) / (60 * 60 * 1000)
  if (kickoffDeltaHours >= 0 && kickoffDeltaHours <= 24) {
    score += 5
    reasons.push('Spiel startet innerhalb von 24 Stunden: +5')
  }
  if (kickoffDeltaHours > 72) {
    score -= 10
    reasons.push('Spiel liegt mehr als 72 Stunden entfernt: -10')
  }
  if (!input.availability.hasApiFootball && !input.availability.hasOdds && !input.availability.hasElo) {
    score -= 15
    reasons.push('Nur statische Fallback-Daten: -15')
  }

  const normalized = clamp(score)
  const label = normalized >= 75 ? 'Hoch' : normalized >= 50 ? 'Mittel' : 'Niedrig'

  return { score: normalized, label, reasons }
}
