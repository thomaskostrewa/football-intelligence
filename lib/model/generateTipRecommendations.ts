import type { ExactScoreProbability } from './calculateExactScoreMatrix'

export type TipRecommendations = {
  safestPick: {
    score: string
    probability: number
    reason: string
  }
  valuePick: {
    score: string
    probability: number
    reason: string
  }
  attackPick: {
    score: string
    probability: number
    reason: string
  }
  avoid: {
    score: string
    reason: string
  }[]
}

export function generateTipRecommendations(scores: ExactScoreProbability[]): TipRecommendations {
  const ordered = [...scores].sort((a, b) => a.rank - b.rank)
  const safest = ordered[0]
  const value = ordered.slice(1, 5).find(score => score.homeGoals !== score.awayGoals) ?? ordered[1] ?? safest
  const attack = ordered.find(score => Math.abs(score.homeGoals - score.awayGoals) >= 2 && score.probability >= 0.04) ?? value
  const avoid = ordered
    .filter(score => score.probability < 0.025 && (score.homeGoals + score.awayGoals >= 4 || Math.abs(score.homeGoals - score.awayGoals) >= 3))
    .slice(0, 3)
    .map(score => ({
      score: score.label,
      reason: 'Optisch reizvoll, aber vom Modell deutlich unterstuetzt.',
    }))

  return {
    safestPick: {
      score: safest.label,
      probability: safest.probability,
      reason: 'Hoechste Einzelwahrscheinlichkeit im Exact-Score-Modell.',
    },
    valuePick: {
      score: value.label,
      probability: value.probability,
      reason: 'Top-5 Ergebnis mit besserem Tipp-Potenzial als reine Absicherung.',
    },
    attackPick: {
      score: attack.label,
      probability: attack.probability,
      reason: attack.probability >= 0.04 ? 'Plausibler Angriffskorridor mit hoeherem Differenzwert.' : 'Aggressivster noch vertretbarer Korridor.',
    },
    avoid,
  }
}
