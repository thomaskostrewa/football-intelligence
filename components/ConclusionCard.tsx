import type { Lang } from '@/lib/i18n'
import { t } from '@/lib/i18n'
import type { ScoreProbability } from '@/lib/prediction'

interface Props {
  result: ScoreProbability
  reasoning: string
  lang: Lang
}

export default function ConclusionCard({ result, reasoning, lang }: Props) {
  const tr = t[lang]

  return (
    <div className="bg-card rounded-xl border border-border p-5 md:p-6">
      <div className="flex items-start gap-4">
        {/* Lightbulb icon */}
        <div className="shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mt-0.5">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 2a6 6 0 0 1 4.5 10.1c-.6.6-1 1.4-1 2.2v.7H6.5v-.7c0-.8-.4-1.6-1-2.2A6 6 0 0 1 10 2z"
              stroke="#B89C6A" strokeWidth="1.4" fill="none"
            />
            <path d="M7 17h6M8 19h4" stroke="#B89C6A" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-text-muted">{tr.conclusion_subtitle}</p>
          <h3 className="text-sm font-semibold text-text-primary mt-0.5">{tr.conclusion_title}</h3>
        </div>

        <div className="text-right shrink-0">
          <p className="text-3xl font-bold text-text-primary">{result.home}:{result.away}</p>
          <p className="text-sm font-semibold text-positive">{(result.probability * 100).toFixed(1)}%</p>
        </div>
      </div>

      {reasoning && (
        <p className="mt-4 text-sm text-text-muted leading-relaxed border-t border-border pt-4">
          {reasoning}
        </p>
      )}
    </div>
  )
}
