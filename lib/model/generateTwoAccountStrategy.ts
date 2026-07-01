import type { ExactScoreProbability } from './calculateExactScoreMatrix'
import type { TipRecommendations } from './generateTipRecommendations'

export type TwoAccountStrategy = {
  ricky: {
    score: string
    role: 'stabil' | 'druckvoll' | 'absichernd'
    reason: string
  }
  elThomas: {
    score: string
    role: 'stabil' | 'druckvoll' | 'absichernd'
    reason: string
  }
}

export function generateTwoAccountStrategy(scores: ExactScoreProbability[], recommendations: TipRecommendations): TwoAccountStrategy {
  const top = scores[0]
  const secondLane = recommendations.valuePick.score !== top.label ? recommendations.valuePick : recommendations.attackPick
  const topDominates = top.probability >= 0.16 && top.probability > (scores[1]?.probability ?? 0) * 1.45

  return {
    ricky: {
      score: top.label,
      role: topDominates ? 'absichernd' : 'stabil',
      reason: 'Deckt den wahrscheinlichsten Modellkorridor ab.',
    },
    elThomas: {
      score: topDominates ? top.label : secondLane.score,
      role: topDominates ? 'stabil' : 'druckvoll',
      reason: topDominates ? 'Top-Ergebnis dominiert klar genug fuer Dopplung.' : 'Greift einen zweiten plausiblen Value-Korridor an.',
    },
  }
}
