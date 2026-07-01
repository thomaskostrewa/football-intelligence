 'use client'

import type { MatchIntelligenceResponse } from '@/lib/model/matchIntelligence'
import { useTimezone } from './TimezonePreference'

type Props = {
  intelligence: MatchIntelligenceResponse
}

const sourceLabels: Array<[keyof MatchIntelligenceResponse['sourceStatus'], string]> = [
  ['hasApiFootball', 'API-Football'],
  ['hasOdds', 'Marktquoten'],
  ['hasElo', 'Elo'],
  ['hasWeather', 'Wetter'],
  ['hasLineups', 'Lineups'],
]

const healthKeys: Partial<Record<keyof MatchIntelligenceResponse['sourceStatus'], keyof MatchIntelligenceResponse['sourceHealth']>> = {
  hasApiFootball: 'apiFootball',
  hasOdds: 'odds',
  hasElo: 'elo',
  hasWeather: 'weather',
  hasLineups: 'lineups',
}

const weightLabels: Array<[keyof MatchIntelligenceResponse['sourceWeights'], string]> = [
  ['odds', 'Odds'],
  ['apiFootball', 'API-Football'],
  ['elo', 'Elo'],
  ['form', 'Form'],
  ['weather', 'Wetter'],
]

const freshnessLabels: Array<{
  key: keyof MatchIntelligenceResponse['sourceStatus'] | 'model'
  label: string
  window: string
}> = [
  { key: 'model', label: 'Modell', window: '15 Min Cache' },
  { key: 'hasApiFootball', label: 'API-Football', window: '30 Min bis 6 Std' },
  { key: 'hasOdds', label: 'Quoten', window: '20 Min Cache' },
  { key: 'hasWeather', label: 'Wetter', window: '60 Min Cache' },
  { key: 'hasLineups', label: 'Lineups', window: '10 Min Cache' },
]

export default function SourceTransparencyPanel({ intelligence }: Props) {
  const { timezone, timezoneLabel } = useTimezone()
  const checkedAt = new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: timezone,
  }).format(new Date(intelligence.lastUpdated))
  const updateAt = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: timezone,
  }).format(new Date(intelligence.lastUpdated))

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Datenqualitaet</h2>
          <p className="text-xs text-text-muted mt-1">
            Update {updateAt} · {timezoneLabel}
          </p>
        </div>
        <div
          className={`rounded-lg px-3 py-2 text-right ${
            intelligence.confidence.label === 'Hoch'
              ? 'bg-positive/10 text-positive'
              : intelligence.confidence.label === 'Mittel'
                ? 'bg-accent/10 text-accent'
                : 'bg-[#F2D5D5] text-[#8B2E2E]'
          }`}
        >
          <p className="text-lg font-bold leading-none">{intelligence.confidence.score}</p>
          <p className="text-[10px] font-semibold mt-1">{intelligence.confidence.label}</p>
        </div>
      </div>

      <div className="space-y-2">
        {sourceLabels.map(([key, label]) => {
          const active = intelligence.sourceStatus[key]
          const health = intelligence.sourceHealth[healthKeys[key] ?? 'apiFootball']
          const isWarning = health.status === 'limited' || health.status === 'blocked' || health.status === 'error'
          return (
            <div key={key} className="space-y-0.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">{label}</span>
                <span className={`font-semibold ${active ? 'text-positive' : isWarning ? 'text-[#8B2E2E]' : 'text-text-muted'}`}>
                  {active ? 'aktiv' : isWarning ? 'Achtung' : key === 'hasLineups' ? 'noch nicht verfuegbar' : 'fehlt'}
                </span>
              </div>
              {!active && (
                <p className={`text-[10px] leading-tight ${isWarning ? 'text-[#8B2E2E]' : 'text-text-muted'}`}>
                  {health.message}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {Object.entries(intelligence.sourceHealth).some(([, health]) => health.status === 'limited' || health.status === 'blocked' || health.status === 'error') && (
        <div className="mt-4 rounded-lg border border-[#E9B8B8] bg-[#FDF3F3] p-3">
          <p className="text-xs font-semibold text-[#8B2E2E]">Externe Datenquelle eingeschraenkt</p>
          <p className="text-[11px] text-[#8B2E2E] mt-1 leading-relaxed">
            Mindestens eine API liefert gerade keine belastbaren Daten. Das Modell rechnet weiter mit verfuegbaren Quellen und senkt die Confidence entsprechend.
          </p>
        </div>
      )}

      <div className="border-t border-border mt-4 pt-4 space-y-2">
        {weightLabels.map(([key, label]) => (
          <div key={key} className="grid grid-cols-[88px_1fr_40px] items-center gap-2 text-xs">
            <span className="text-text-muted">{label}</span>
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full bg-positive" style={{ width: `${intelligence.sourceWeights[key] * 100}%` }} />
            </div>
            <span className="text-right font-semibold text-text-primary">{Math.round(intelligence.sourceWeights[key] * 100)}%</span>
          </div>
        ))}
      </div>

      <ul className="border-t border-border mt-4 pt-4 space-y-2">
        {intelligence.notes.slice(0, 3).map(note => (
          <li key={note} className="text-xs text-text-muted leading-relaxed">{note}</li>
        ))}
      </ul>

      <div className="border-t border-border mt-4 pt-3">
        <p className="text-[10px] font-semibold uppercase text-text-muted">Datenstand</p>
        <div className="mt-2 space-y-1.5">
          {freshnessLabels.map(item => {
            const active = item.key === 'model' ? true : intelligence.sourceStatus[item.key]
            const health = item.key === 'model' ? null : intelligence.sourceHealth[healthKeys[item.key] ?? 'apiFootball']
            const quota = health?.quota
            const quotaText = quota && (quota.remaining != null || quota.used != null)
              ? ` · Kontingent ${quota.remaining != null ? `${quota.remaining} uebrig` : ''}${quota.used != null ? `${quota.remaining != null ? ', ' : ''}${quota.used} genutzt` : ''}`
              : ''

            return (
              <div key={item.key} className="grid grid-cols-[72px_1fr] gap-2 text-[10px] leading-tight">
                <span className={active ? 'text-text-primary font-semibold' : 'text-text-muted'}>
                  {item.label}
                </span>
                <span className="text-text-muted">
                  {active ? `geprueft ${checkedAt}` : health?.message ?? 'nicht verfuegbar'} · {item.window}{quotaText}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
