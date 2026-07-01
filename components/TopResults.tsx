import type { Lang } from '@/lib/i18n'
import { t } from '@/lib/i18n'
import type { ExactScoreProbability } from '@/lib/model/calculateExactScoreMatrix'

interface Props {
  topResults: ExactScoreProbability[]
  lang: Lang
}

export default function TopResults({ topResults, lang }: Props) {
  const tr = t[lang]
  const top10 = topResults.slice(0, 10)
  const max = top10[0]?.probability ?? 1

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h2 className="text-sm font-semibold text-text-primary mb-4">{tr.top10}</h2>

      <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
        {top10.map((score, i) => {
          const isFirst = i === 0
          const ratio = score.probability / max
          return (
            <div
              key={i}
              className="flex flex-col items-center gap-1 p-2 rounded-lg border transition-all"
              style={{
                borderColor: isFirst ? '#5E8B64' : '#E8E3DD',
                backgroundColor: isFirst ? '#F0F6F1' : '#FAFAF9',
              }}
            >
              <span className="text-[10px] font-semibold text-text-muted">#{i + 1}</span>
              <span className={`text-base font-bold ${isFirst ? 'text-positive' : 'text-text-primary'}`}>
                {score.homeGoals}:{score.awayGoals}
              </span>
              <div className="w-full bg-border rounded-full h-1">
                <div
                  className="h-1 rounded-full"
                  style={{
                    width: `${ratio * 100}%`,
                    backgroundColor: isFirst ? '#5E8B64' : '#B89C6A',
                  }}
                />
              </div>
              <span className={`text-[10px] font-semibold ${isFirst ? 'text-positive' : 'text-text-muted'}`}>
                {(score.probability * 100).toFixed(1)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
