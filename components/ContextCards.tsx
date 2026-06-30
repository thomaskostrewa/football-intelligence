import type { Lang } from '@/lib/i18n'
import { t } from '@/lib/i18n'

interface Team {
  name: { de: string; en: string; pt: string }
  xgAvg: number
  goalsAgainstAvg: number
  form: string[]
}

interface Match {
  weather: { icon: string; temp: number; desc: { de: string; en: string; pt: string } }
  importance: { de: string; en: string; pt: string }
}

interface Props {
  match: Match
  homeTeam: Team
  awayTeam: Team
  lang: Lang
}

function FormBadge({ result }: { result: string }) {
  return (
    <span className={`form-badge form-badge-${result}`}>
      {result}
    </span>
  )
}

export default function ContextCards({ match, homeTeam, awayTeam, lang }: Props) {
  const tr = t[lang]

  const cards = [
    {
      title: tr.form_last5,
      content: (
        <div className="space-y-2 mt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">{homeTeam.name[lang]}</span>
            <div className="flex gap-1">
              {homeTeam.form.map((r, i) => <FormBadge key={i} result={r} />)}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">{awayTeam.name[lang]}</span>
            <div className="flex gap-1">
              {awayTeam.form.map((r, i) => <FormBadge key={i} result={r} />)}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: tr.expected_goals,
      content: (
        <div className="space-y-1.5 mt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">{homeTeam.name[lang]}</span>
            <span className="text-lg font-semibold text-text-primary">{homeTeam.xgAvg.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">{awayTeam.name[lang]}</span>
            <span className="text-lg font-semibold text-text-primary">{awayTeam.xgAvg.toFixed(2)}</span>
          </div>
        </div>
      ),
    },
    {
      title: tr.goals_against,
      content: (
        <div className="space-y-1.5 mt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">{homeTeam.name[lang]}</span>
            <span className="text-lg font-semibold text-text-primary">{homeTeam.goalsAgainstAvg.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">{awayTeam.name[lang]}</span>
            <span className="text-lg font-semibold text-text-primary">{awayTeam.goalsAgainstAvg.toFixed(2)}</span>
          </div>
        </div>
      ),
    },
    {
      title: tr.weather,
      content: (
        <div className="mt-1 flex items-center gap-3">
          <span className="text-2xl">{match.weather.icon}</span>
          <div>
            <p className="text-lg font-semibold">{match.weather.temp}°</p>
            <p className="text-xs text-text-muted">{match.weather.desc[lang]}</p>
          </div>
        </div>
      ),
    },
    {
      title: tr.importance,
      content: (
        <div className="mt-1">
          <p className="text-sm font-semibold text-text-primary">KO-Spiel</p>
          <p className="text-xs text-text-muted mt-0.5">{match.importance[lang]}</p>
        </div>
      ),
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
      {cards.map(card => (
        <div key={card.title} className="bg-card rounded-xl border border-border p-4">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted">{card.title}</p>
          {card.content}
        </div>
      ))}
    </div>
  )
}
