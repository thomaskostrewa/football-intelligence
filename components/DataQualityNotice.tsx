import type { MatchIntelligenceResponse } from '@/lib/model/matchIntelligence'

type Props = {
  intelligence: MatchIntelligenceResponse
  compact?: boolean
}

function getUnavailableCoreSources(intelligence: MatchIntelligenceResponse) {
  const sources: string[] = []
  if (!intelligence.sourceStatus.hasOdds) sources.push('Marktquoten')
  if (!intelligence.sourceStatus.hasApiFootball) sources.push('API-Football')
  if (!intelligence.sourceStatus.hasWeather) sources.push('Wetter')
  return sources
}

export default function DataQualityNotice({ intelligence, compact = false }: Props) {
  const missingSources = getUnavailableCoreSources(intelligence)
  const shouldShow = intelligence.confidence.score < 70 || missingSources.length > 0

  if (!shouldShow) return null

  const sourceText = missingSources.length
    ? `Fehlende Quellen: ${missingSources.join(', ')}.`
    : 'Alle Kernquellen sind aktiv, die Modell-Confidence liegt dennoch unter dem Zielwert.'

  return (
    <div className={`rounded-lg border border-[#E5CFA8] bg-[#FFF8EA] ${compact ? 'p-3' : 'p-4'}`}>
      <p className="text-xs font-semibold text-[#7A5A24]">Eingeschraenkte Prognose</p>
      <p className="text-[11px] leading-relaxed text-[#7A5A24] mt-1">
        Datenqualitaet {intelligence.confidence.score}/100. {sourceText} Die Tipps werden berechnet, sollten aber defensiver gelesen werden.
      </p>
    </div>
  )
}
