import { cached } from '@/lib/data-sources/cache'
import type { MatchData, TeamData } from '@/lib/match-view-model'
import { buildMatchModelInput, type MatchModelInput } from './buildMatchModelInput'
import { calculateConfidenceScore, type ConfidenceScore } from './calculateConfidenceScore'
import { calculateExactScoreMatrix, calculateRestProbability, type ExactScoreProbability } from './calculateExactScoreMatrix'
import { calculateLambdas, type LambdaResult } from './calculateLambdas'
import { generateTipRecommendations, type TipRecommendations } from './generateTipRecommendations'
import { generateTwoAccountStrategy, type TwoAccountStrategy } from './generateTwoAccountStrategy'

export type MatchIntelligenceResponse = {
  fixtureId: string
  homeTeam: string
  awayTeam: string
  kickoff: string
  lambdaHome: number
  lambdaAway: number
  exactScores: ExactScoreProbability[]
  topScores: ExactScoreProbability[]
  restProbability: number
  confidence: ConfidenceScore
  recommendations: TipRecommendations
  twoAccountStrategy?: TwoAccountStrategy
  sourceWeights: LambdaResult['sourceWeights']
  sourceStatus: MatchModelInput['availability']
  sourceHealth: MatchModelInput['sourceHealth']
  notes: string[]
  lastUpdated: string
}

export async function buildMatchIntelligence({
  match,
  homeTeam,
  awayTeam,
  refresh = false,
}: {
  match: MatchData
  homeTeam: TeamData
  awayTeam: TeamData
  refresh?: boolean
}): Promise<MatchIntelligenceResponse> {
  return cached(`match-intelligence:${match.id}`, 15 * 60 * 1000, refresh, async () => {
    const input = await buildMatchModelInput({ match, homeTeam, awayTeam, refresh })
    const lambdas = calculateLambdas(input)
    const exactScores = calculateExactScoreMatrix(lambdas.lambdaHome, lambdas.lambdaAway, 5)
    const topScores = exactScores.slice(0, 10)
    const recommendations = generateTipRecommendations(exactScores)

    return {
      fixtureId: input.fixtureId,
      homeTeam: input.homeTeam,
      awayTeam: input.awayTeam,
      kickoff: input.kickoff,
      lambdaHome: lambdas.lambdaHome,
      lambdaAway: lambdas.lambdaAway,
      exactScores,
      topScores,
      restProbability: calculateRestProbability(exactScores),
      confidence: calculateConfidenceScore(input),
      recommendations,
      twoAccountStrategy: generateTwoAccountStrategy(exactScores, recommendations),
      sourceWeights: lambdas.sourceWeights,
      sourceStatus: input.availability,
      sourceHealth: input.sourceHealth,
      notes: lambdas.notes,
      lastUpdated: new Date().toISOString(),
    }
  })
}
