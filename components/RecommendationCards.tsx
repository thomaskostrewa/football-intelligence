import type { MatchIntelligenceResponse } from '@/lib/model/matchIntelligence'
import DataQualityNotice from './DataQualityNotice'

type Props = {
  intelligence: MatchIntelligenceResponse
}

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

export default function RecommendationCards({ intelligence }: Props) {
  const mostLikely = intelligence.topScores[0]
  const cards = [
    {
      title: 'Wahrscheinlichster Tipp',
      score: mostLikely.label,
      probability: mostLikely.probability,
      reason: 'Top-Rang der 0:0 bis 5:5 Matrix.',
    },
    {
      title: 'Sicherheitskorridor',
      score: intelligence.recommendations.safestPick.score,
      probability: intelligence.recommendations.safestPick.probability,
      reason: intelligence.recommendations.safestPick.reason,
    },
    {
      title: 'Value-Tipp',
      score: intelligence.recommendations.valuePick.score,
      probability: intelligence.recommendations.valuePick.probability,
      reason: intelligence.recommendations.valuePick.reason,
    },
    {
      title: 'Angriffstipp',
      score: intelligence.recommendations.attackPick.score,
      probability: intelligence.recommendations.attackPick.probability,
      reason: intelligence.recommendations.attackPick.reason,
    },
  ]

  return (
    <div className="bg-card rounded-xl border border-border p-5 md:p-6">
      <h2 className="text-sm font-semibold text-text-primary mb-4">Tipp-Empfehlungen</h2>
      <div className="mb-4">
        <DataQualityNotice intelligence={intelligence} compact />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map(card => (
          <div key={card.title} className="rounded-lg border border-border p-4 bg-background">
            <p className="text-xs font-semibold text-text-muted">{card.title}</p>
            <div className="flex items-end justify-between gap-3 mt-2">
              <p className="text-2xl font-bold text-text-primary">{card.score}</p>
              <p className="text-sm font-semibold text-positive">{percent(card.probability)}</p>
            </div>
            <p className="text-xs text-text-muted mt-2 leading-relaxed">{card.reason}</p>
          </div>
        ))}
      </div>

      {intelligence.twoAccountStrategy && (
        <div className="border-t border-border mt-5 pt-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Moriarty Split</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['ricky', 'elThomas'] as const).map(account => {
              const item = intelligence.twoAccountStrategy?.[account]
              if (!item) return null
              return (
                <div key={account} className="rounded-lg bg-background border border-border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-text-muted">{account === 'ricky' ? 'Ricky' : 'elThomas'}</p>
                    <p className="text-[10px] font-semibold text-accent uppercase">{item.role}</p>
                  </div>
                  <p className="text-xl font-bold text-text-primary mt-2">{item.score}</p>
                  <p className="text-xs text-text-muted mt-2 leading-relaxed">{item.reason}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
