import Anthropic from '@anthropic-ai/sdk'
import type { Lang } from './i18n'

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

interface ReasoningInput {
  homeTeam: { name: { de: string; en: string; pt: string }; xgAvg: number; goalsAgainstAvg: number; form: string[] }
  awayTeam: { name: { de: string; en: string; pt: string }; xgAvg: number; goalsAgainstAvg: number; form: string[] }
  prediction: { home: number; away: number; probability: number }
  homeWinProb: number
  drawProb: number
  awayWinProb: number
  weather: { desc: { de: string; en: string; pt: string } }
  lang: Lang
}

const langNames = { de: 'German', en: 'English', pt: 'Portuguese' }

export async function generateReasoning(input: ReasoningInput): Promise<string> {
  if (!client) {
    return getFallbackReasoning(input)
  }

  const { homeTeam, awayTeam, prediction, homeWinProb, drawProb, awayWinProb, weather, lang } = input
  const hn = homeTeam.name[lang]
  const an = awayTeam.name[lang]
  const result = `${prediction.home}:${prediction.away}`
  const prob = (prediction.probability * 100).toFixed(1)

  const prompt = `You are Football Intelligence, an AI match prediction system. Write a concise 2-3 sentence explanation in ${langNames[lang]} about why ${result} (${prob}%) is the most likely exact score for this World Cup 2026 knockout match.

Match: ${hn} vs ${an}
Key data:
- ${hn} xG average: ${homeTeam.xgAvg.toFixed(2)} | Goals against avg: ${homeTeam.goalsAgainstAvg.toFixed(2)} | Form: ${homeTeam.form.join('-')}
- ${an} xG average: ${awayTeam.xgAvg.toFixed(2)} | Goals against avg: ${awayTeam.goalsAgainstAvg.toFixed(2)} | Form: ${awayTeam.form.join('-')}
- Win probabilities: ${hn} ${(homeWinProb * 100).toFixed(0)}% / Draw ${(drawProb * 100).toFixed(0)}% / ${an} ${(awayWinProb * 100).toFixed(0)}%
- Weather: ${weather.desc.en}
- Stakes: Knockout game

Rules: Be data-driven. Mention xG values or form. No fluff. No bullet points. Just 2-3 flowing sentences. Write in ${langNames[lang]}.`

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = msg.content[0]
    return text.type === 'text' ? text.text : getFallbackReasoning(input)
  } catch {
    return getFallbackReasoning(input)
  }
}

function getFallbackReasoning(input: ReasoningInput): string {
  const { homeTeam, awayTeam, prediction, lang } = input
  const hn = homeTeam.name[lang]
  const an = awayTeam.name[lang]
  const result = `${prediction.home}:${prediction.away}`

  const texts: Record<Lang, string> = {
    de: `${hn} (Ø ${homeTeam.xgAvg.toFixed(2)} xG) und ${an} (Ø ${awayTeam.xgAvg.toFixed(2)} xG) sind in puncto Angriffsstärke nahezu gleichwertig. Beide Teams verteidigen überdurchschnittlich stabil, was torreiche Spiele unwahrscheinlich macht. Das Modell bewertet ${result} als wahrscheinlichstes Ergebnis, da die xG-Werte und Formkurven auf ein knappes, ausgeglichenes Spiel hindeuten.`,
    en: `${hn} (avg ${homeTeam.xgAvg.toFixed(2)} xG) and ${an} (avg ${awayTeam.xgAvg.toFixed(2)} xG) are closely matched in attacking output. Both teams show solid defensive records, making high-scoring outcomes unlikely. The model rates ${result} as most probable given how closely the xG values and recent form align.`,
    pt: `${hn} (méd ${homeTeam.xgAvg.toFixed(2)} xG) e ${an} (méd ${awayTeam.xgAvg.toFixed(2)} xG) estão muito equilibrados em termos ofensivos. Ambas as equipas apresentam registos defensivos sólidos, tornando resultados de muitos golos improváveis. O modelo aponta ${result} como o resultado mais provável com base nos valores de xG e na forma recente.`,
  }
  return texts[lang]
}
