import type { Lang } from '@/lib/i18n'
import { t } from '@/lib/i18n'
import type { ExplainFactor } from '@/lib/prediction'

interface Team {
  name: { de: string; en: string; pt: string }
}

interface ScoreResult {
  home: number
  away: number
  probability: number
}

interface Props {
  factors: ExplainFactor[]
  result: ScoreResult
  homeTeam: Team
  awayTeam: Team
  lang: Lang
}

export default function ExplainabilityPanel({ factors, result, homeTeam, awayTeam, lang }: Props) {
  const tr = t[lang]
  const scoreStr = `${result.home}:${result.away}`

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h2 className="text-sm font-semibold text-text-primary mb-4 leading-snug">
        {tr.why_title}{' '}
        <span className="text-accent">{scoreStr}</span>{' '}
        {tr.why_highest}
      </h2>

      <ul className="space-y-4">
        {factors.map((factor, i) => (
          <li key={i} className="flex gap-3">
            <span className="text-lg shrink-0 mt-0.5">{factor.icon}</span>
            <div>
              <p className="text-sm font-semibold text-text-primary">{factor.title[lang]}</p>
              <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{factor.description[lang]}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
