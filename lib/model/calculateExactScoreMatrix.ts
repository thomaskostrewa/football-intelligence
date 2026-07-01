export type ExactScoreProbability = {
  homeGoals: number
  awayGoals: number
  probability: number
  label: string
  rank: number
}

function factorial(n: number) {
  if (n <= 1) return 1
  let result = 1
  for (let i = 2; i <= n; i += 1) result *= i
  return result
}

function poisson(k: number, lambda: number) {
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k)
}

export function calculateExactScoreMatrix(lambdaHome: number, lambdaAway: number, maxGoals = 5): ExactScoreProbability[] {
  const scores: ExactScoreProbability[] = []

  for (let homeGoals = 0; homeGoals <= maxGoals; homeGoals += 1) {
    for (let awayGoals = 0; awayGoals <= maxGoals; awayGoals += 1) {
      scores.push({
        homeGoals,
        awayGoals,
        probability: poisson(homeGoals, lambdaHome) * poisson(awayGoals, lambdaAway),
        label: `${homeGoals}:${awayGoals}`,
        rank: 0,
      })
    }
  }

  return scores
    .sort((a, b) => b.probability - a.probability || a.homeGoals - b.homeGoals || a.awayGoals - b.awayGoals)
    .map((score, index) => ({ ...score, rank: index + 1 }))
}

export function calculateRestProbability(scores: ExactScoreProbability[]) {
  const covered = scores.reduce((sum, score) => sum + score.probability, 0)
  return Math.max(0, 1 - covered)
}
