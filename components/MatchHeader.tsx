'use client'

import { useEffect, useState } from 'react'
import type { Lang } from '@/lib/i18n'
import { t } from '@/lib/i18n'

interface Team {
  name: { de: string; en: string; pt: string }
  flag: string
  code: string
}

interface Match {
  date: string
  round: { de: string; en: string; pt: string }
  venue: { de: string; en: string; pt: string }
}

interface Props {
  match: Match
  homeTeam: Team
  awayTeam: Team
  lang: Lang
}

function useCountdown(targetDate: string) {
  const [diff, setDiff] = useState<number>(0)

  useEffect(() => {
    const update = () => setDiff(new Date(targetDate).getTime() - Date.now())
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  if (diff <= 0) return null

  const totalSeconds = Math.floor(diff / 1000)
  const d = Math.floor(totalSeconds / 86400)
  const h = Math.floor((totalSeconds % 86400) / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60

  return { d, h, m, s }
}

export default function MatchHeader({ match, homeTeam, awayTeam, lang }: Props) {
  const tr = t[lang]
  const countdown = useCountdown(match.date)
  const matchDate = new Date(match.date)

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="bg-card rounded-xl border border-border p-5 md:p-7">
      {/* Teams */}
      <div className="flex items-center justify-center gap-4 md:gap-8 mb-5">
        <div className="text-center flex-1">
          <div className="text-4xl md:text-5xl mb-2">{homeTeam.flag}</div>
          <h1 className="text-xl md:text-3xl font-bold tracking-tight">{homeTeam.name[lang]}</h1>
        </div>

        <div className="text-center shrink-0">
          <span className="text-2xl md:text-3xl font-light text-text-muted">vs</span>
        </div>

        <div className="text-center flex-1">
          <div className="text-4xl md:text-5xl mb-2">{awayTeam.flag}</div>
          <h1 className="text-xl md:text-3xl font-bold tracking-tight">{awayTeam.name[lang]}</h1>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-text-muted">
        <span className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="2" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M1 6h12M5 2v2M9 2v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          {match.round[lang]}
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1C4.24 1 2 3.24 2 6c0 3.75 5 7 5 7s5-3.25 5-7c0-2.76-2.24-5-5-5zm0 6.75A1.75 1.75 0 1 1 7 4.25a1.75 1.75 0 0 1 0 3.5z" fill="currentColor" opacity=".7"/>
          </svg>
          {match.venue[lang]}
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M7 4v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          {matchDate.toLocaleDateString(lang === 'de' ? 'de-DE' : lang === 'pt' ? 'pt-PT' : 'en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric'
          })}
          {' '}
          {matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>

        {countdown && (
          <span className="flex items-center gap-1 text-accent font-medium">
            {tr.countdown_prefix && `${tr.countdown_prefix} `}
            {countdown.d > 0 && `${countdown.d}${tr.days} `}
            {pad(countdown.h)}{tr.hours} {pad(countdown.m)}{tr.minutes} {pad(countdown.s)}{tr.seconds}
          </span>
        )}
      </div>
    </div>
  )
}
