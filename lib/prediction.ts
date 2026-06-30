/**
 * Football Intelligence – Prediction Engine
 * Double Poisson model for exact score probabilities.
 *
 * λ_home = team's average xG (attack vs average defense)
 * λ_away = team's average xG
 * P(X=k) = e^(-λ) * λ^k / k!
 *
 * We cap at MAX_GOALS per team and normalize over the truncated distribution.
 */

const MAX_GOALS = 4 // Show 0..4 goals per team (5x5 grid)

function factorial(n: number): number {
  if (n <= 1) return 1
  let result = 1
  for (let i = 2; i <= n; i++) result *= i
  return result
}

function poissonPMF(k: number, lambda: number): number {
  return Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k)
}

export interface ScoreProbability {
  home: number
  away: number
  probability: number
}

export interface PredictionResult {
  matrix: number[][] // matrix[homeGoals][awayGoals] = probability (normalized, 0..1)
  topResults: ScoreProbability[]
  homeWinProb: number
  drawProb: number
  awayWinProb: number
  mostLikelyResult: ScoreProbability
  lambdaHome: number
  lambdaAway: number
}

export function computePrediction(xgHome: number, xgAway: number): PredictionResult {
  // Build raw matrix
  const raw: number[][] = []
  let totalMass = 0

  for (let h = 0; h <= MAX_GOALS; h++) {
    raw[h] = []
    for (let a = 0; a <= MAX_GOALS; a++) {
      const p = poissonPMF(h, xgHome) * poissonPMF(a, xgAway)
      raw[h][a] = p
      totalMass += p
    }
  }

  // Normalize over the truncated grid
  const matrix: number[][] = []
  const allScores: ScoreProbability[] = []

  for (let h = 0; h <= MAX_GOALS; h++) {
    matrix[h] = []
    for (let a = 0; a <= MAX_GOALS; a++) {
      const p = raw[h][a] / totalMass
      matrix[h][a] = p
      allScores.push({ home: h, away: a, probability: p })
    }
  }

  // Sort for top 10
  allScores.sort((a, b) => b.probability - a.probability)
  const topResults = allScores.slice(0, 10)
  const mostLikelyResult = topResults[0]

  // Outcome probabilities
  let homeWinProb = 0
  let drawProb = 0
  let awayWinProb = 0

  for (const s of allScores) {
    if (s.home > s.away) homeWinProb += s.probability
    else if (s.home === s.away) drawProb += s.probability
    else awayWinProb += s.probability
  }

  return {
    matrix,
    topResults,
    homeWinProb,
    drawProb,
    awayWinProb,
    mostLikelyResult,
    lambdaHome: xgHome,
    lambdaAway: xgAway,
  }
}

/**
 * Derive the top explainability factors from match data.
 * Returns deterministic factors – no AI needed for the icons/labels.
 */
export interface ExplainFactor {
  icon: string
  titleKey: string
  title: { de: string; en: string; pt: string }
  description: { de: string; en: string; pt: string }
}

export function computeFactors(
  homeTeam: { name: { de: string; en: string; pt: string }; xgAvg: number; goalsAgainstAvg: number; form: string[] },
  awayTeam: { name: { de: string; en: string; pt: string }; xgAvg: number; goalsAgainstAvg: number; form: string[] },
  prediction: PredictionResult,
  weather: { desc: { de: string; en: string; pt: string } }
): ExplainFactor[] {
  const factors: ExplainFactor[] = []

  // 1. xG comparison
  const xgDiff = Math.abs(homeTeam.xgAvg - awayTeam.xgAvg)
  if (xgDiff < 0.4) {
    factors.push({
      icon: '🎯',
      titleKey: 'similar_xg',
      title: { de: 'Ähnliches Torpotenzial', en: 'Similar goal threat', pt: 'Potencial de golo semelhante' },
      description: {
        de: `${homeTeam.name.de} erzeugt Ø ${homeTeam.xgAvg.toFixed(2)} xG, ${awayTeam.name.de} Ø ${awayTeam.xgAvg.toFixed(2)} xG pro Spiel.`,
        en: `${homeTeam.name.en} averages ${homeTeam.xgAvg.toFixed(2)} xG, ${awayTeam.name.en} ${awayTeam.xgAvg.toFixed(2)} xG per game.`,
        pt: `${homeTeam.name.pt} tem Ø ${homeTeam.xgAvg.toFixed(2)} xG, ${awayTeam.name.pt} Ø ${awayTeam.xgAvg.toFixed(2)} xG por jogo.`,
      },
    })
  } else {
    const stronger = homeTeam.xgAvg > awayTeam.xgAvg ? homeTeam : awayTeam
    factors.push({
      icon: '🎯',
      titleKey: 'xg_advantage',
      title: { de: 'Offensiver Vorteil', en: 'Attacking advantage', pt: 'Vantagem ofensiva' },
      description: {
        de: `${stronger.name.de} hat klare xG-Überlegenheit mit Ø ${stronger.xgAvg.toFixed(2)} Torchancenwert.`,
        en: `${stronger.name.en} holds a clear xG advantage with Ø ${stronger.xgAvg.toFixed(2)} expected goals.`,
        pt: `${stronger.name.pt} tem clara vantagem em xG com Ø ${stronger.xgAvg.toFixed(2)} golos esperados.`,
      },
    })
  }

  // 2. Defense
  const avgGA = (homeTeam.goalsAgainstAvg + awayTeam.goalsAgainstAvg) / 2
  if (avgGA < 1.2) {
    factors.push({
      icon: '🛡',
      titleKey: 'defensive',
      title: { de: 'Defensiv stabil', en: 'Defensively solid', pt: 'Defensivamente sólido' },
      description: {
        de: `Beide Teams gehören zu den defensiv stärkeren Mannschaften im Turnier.`,
        en: `Both teams rank among the tournament's stronger defensive sides.`,
        pt: `Ambas as equipas estão entre as mais sólidas defensivamente no torneio.`,
      },
    })
  }

  // 3. Form
  const homeWins = homeTeam.form.filter(f => f === 'W').length
  const awayWins = awayTeam.form.filter(f => f === 'W').length
  if (Math.abs(homeWins - awayWins) <= 1) {
    factors.push({
      icon: '⚖️',
      titleKey: 'equal_form',
      title: { de: 'Ausgeglichene Form', en: 'Balanced form', pt: 'Forma equilibrada' },
      description: {
        de: `Die Leistungswerte beider Teams liegen sehr nah beieinander.`,
        en: `Both teams' performance values are very close to each other.`,
        pt: `Os valores de desempenho de ambas as equipas estão muito próximos.`,
      },
    })
  }

  // 4. Draw market signal
  if (prediction.drawProb > 0.28) {
    factors.push({
      icon: '📈',
      titleKey: 'market_draw',
      title: { de: 'Marktbewegung', en: 'Market signal', pt: 'Sinal de mercado' },
      description: {
        de: `Internationale Wettmärkte bewegen sich leicht Richtung Unentschieden.`,
        en: `International betting markets are leaning slightly toward a draw.`,
        pt: `Os mercados internacionais de apostas inclinam-se ligeiramente para o empate.`,
      },
    })
  }

  // 5. Weather
  factors.push({
    icon: '🌦',
    titleKey: 'weather',
    title: { de: 'Wetterfaktor', en: 'Weather factor', pt: 'Fator meteorológico' },
    description: {
      de: weather.desc.de + ' kann die Torerwartung leicht beeinflussen.',
      en: weather.desc.en + ' may slightly influence goal expectation.',
      pt: weather.desc.pt + ' pode influenciar ligeiramente a expectativa de golos.',
    },
  })

  return factors.slice(0, 5)
}
