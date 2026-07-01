import type { Lang } from '@/lib/i18n'
import { t } from '@/lib/i18n'
import type { ExactScoreProbability } from '@/lib/model/calculateExactScoreMatrix'

interface Team {
  name: { de: string; en: string; pt: string }
  flag: string
}

interface Props {
  exactScores: ExactScoreProbability[]
  restProbability?: number
  homeTeam: Team
  awayTeam: Team
  lang: Lang
}

// Interpolate between beige (#F7F5F2) and dark green (#5E8B64)
function probToColor(prob: number, maxProb: number): string {
  const ratio = Math.pow(prob / maxProb, 0.6) // gamma adjust for visual clarity
  const r = Math.round(247 + (94 - 247) * ratio)
  const g = Math.round(245 + (139 - 245) * ratio)
  const b = Math.round(242 + (100 - 242) * ratio)
  return `rgb(${r},${g},${b})`
}

function textColor(prob: number, maxProb: number): string {
  return prob / maxProb > 0.5 ? '#FFFFFF' : '#1B1B1B'
}

export default function PredictionHeatmap({ exactScores, restProbability = 0, homeTeam, awayTeam, lang }: Props) {
  const tr = t[lang]
  const GOALS = [0, 1, 2, 3, 4, 5]
  const matrix = exactScores.reduce((acc, score) => {
    acc[score.homeGoals] = acc[score.homeGoals] ?? []
    acc[score.homeGoals][score.awayGoals] = score.probability
    return acc
  }, [] as number[][])

  // Find max probability for color scaling
  let maxProb = 0
  for (const row of matrix) for (const p of row) if (p > maxProb) maxProb = p

  return (
    <div className="bg-card rounded-xl border border-border p-5 md:p-6">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-sm font-semibold text-text-primary">{tr.probability_heatmap}</h2>
        <div className="relative group">
          <span className="w-4 h-4 rounded-full border border-border text-[10px] flex items-center justify-center text-text-muted cursor-help select-none">i</span>
          <div className="absolute right-0 top-6 w-48 bg-text-primary text-card text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg sm:left-6 sm:right-auto sm:top-0 sm:w-52">
            Exact-Score-Modell auf Basis gewichteter Lambdas. Matrix 0:0 bis 5:5, 6+ als Restwahrscheinlichkeit.
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[320px]">
          {/* Away team label (top) */}
          <div className="flex items-center mb-2 ml-14">
            <span className="text-xs text-text-muted flex-1 text-center">
              {awayTeam.flag} {awayTeam.name[lang]} — {tr.away_goals}
            </span>
          </div>

          {/* Column headers */}
          <div className="flex items-center mb-1">
            <div className="w-14 shrink-0" />
            {GOALS.map(a => (
              <div key={a} className="flex-1 text-center text-xs font-semibold text-text-muted">{a}</div>
            ))}
          </div>

          {/* Rows */}
          <div className="flex gap-0">
            {/* Home team label (left) */}
            <div className="flex flex-col items-center justify-center w-6 shrink-0 mr-2">
              <span
                className="text-xs text-text-muted whitespace-nowrap"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                {homeTeam.flag} {homeTeam.name[lang]} — {tr.home_goals}
              </span>
            </div>

            {/* Row numbers + grid */}
            <div className="flex-1 space-y-1">
              {GOALS.map(h => (
                <div key={h} className="flex items-center gap-1">
                  {/* Row label */}
                  <div className="w-6 shrink-0 text-center text-xs font-semibold text-text-muted">{h}</div>

                  {/* Cells */}
                  {GOALS.map(a => {
                    const prob = matrix[h]?.[a] ?? 0
                    const isMax = Math.abs(prob - maxProb) < 0.0001
                    const bg = probToColor(prob, maxProb)
                    const fg = textColor(prob, maxProb)

                    return (
                      <div
                        key={a}
                        className="heatmap-cell flex-1 aspect-square flex items-center justify-center rounded-md text-xs font-semibold cursor-default"
                        style={{
                          backgroundColor: bg,
                          color: fg,
                          outline: isMax ? '2px solid #5E8B64' : 'none',
                          outlineOffset: isMax ? '1px' : '0',
                        }}
                        title={`${h}:${a} — ${(prob * 100).toFixed(1)}%`}
                      >
                        {(prob * 100).toFixed(1)}%
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between mt-4 text-[10px] text-text-muted">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-16 h-2 rounded"
                style={{ background: 'linear-gradient(to right, #F7F5F2, #5E8B64)' }}
              />
              {tr.low_prob}
            </span>
            <span className="flex items-center gap-1.5">
              {tr.high_prob}
              <span
                className="inline-block w-16 h-2 rounded"
                style={{ background: 'linear-gradient(to right, #5E8B64, #2D6B32)' }}
              />
            </span>
          </div>
          <p className="mt-3 text-[11px] text-text-muted">
            Restwahrscheinlichkeit fuer 6+ Tore in mindestens einer Richtung: {(restProbability * 100).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  )
}
