import Link from 'next/link'
import type { Lang } from '@/lib/i18n'
import { t } from '@/lib/i18n'

interface Team {
  id: string; name: { de: string; en: string; pt: string }; flag: string
}

interface Match {
  id: string
  date: string
  homeTeam: string
  awayTeam: string
}

interface Props {
  matches: Match[]
  teams: Record<string, Team>
  activeId: string
  lang: Lang
}

export default function MatchNavigation({ matches, teams, activeId, lang }: Props) {
  const tr = t[lang]
  // Show first 9 matches prominently, rest via "Alle Spiele"
  const visible = matches.slice(0, 9)
  const hasMore = matches.length > 9

  return (
    <nav className="py-2">
      <div className="px-4 pt-3 pb-2">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted">
          World Cup 2026
        </p>
      </div>

      <ul className="space-y-0.5">
        {visible.map(match => {
          const home = teams[match.homeTeam]
          const away = teams[match.awayTeam]
          const isActive = match.id === activeId
          const matchDate = new Date(match.date)
          const isPast = matchDate < new Date()

          return (
            <li key={match.id}>
              <Link
                href={`/${lang}/match/${match.id}`}
                className={`
                  flex flex-col px-4 py-2.5 border-l-2 transition-all
                  ${isActive
                    ? 'border-accent bg-accent/5 text-text-primary'
                    : 'border-transparent text-text-muted hover:text-text-primary hover:bg-background'
                  }
                `}
              >
                <span className={`text-sm font-medium leading-tight ${isActive ? 'text-text-primary' : ''}`}>
                  {home?.flag} {home?.name[lang]}
                </span>
                <span className={`text-sm leading-tight mt-0.5 ${isActive ? 'text-text-muted' : ''}`}>
                  {away?.flag} {away?.name[lang]}
                </span>
                <span className={`text-[10px] mt-1 ${isPast ? 'text-positive' : 'text-text-muted'}`}>
                  {matchDate.toLocaleDateString(lang === 'de' ? 'de-DE' : lang === 'pt' ? 'pt-PT' : 'en-GB', {
                    day: '2-digit', month: '2-digit'
                  })} · {matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </Link>
            </li>
          )
        })}

        {hasMore && (
          <li>
            <div className="px-4 py-3 text-sm text-accent hover:text-text-primary cursor-pointer flex items-center gap-1 transition-colors">
              {tr.all_matches}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </li>
        )}
      </ul>
    </nav>
  )
}
