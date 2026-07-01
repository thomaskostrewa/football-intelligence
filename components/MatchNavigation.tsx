import Link from 'next/link'
import type { Lang } from '@/lib/i18n'
import type { FixtureSource } from '@/lib/fixtures/provider'

interface Team {
  id: string; name: { de: string; en: string; pt: string }; flag: string
  isPlaceholder?: boolean
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
  fixtureSource: FixtureSource
}

export default function MatchNavigation({ matches, teams, activeId, lang, fixtureSource }: Props) {
  const visible = matches
  const sourceLabel = fixtureSource.isLive
    ? fixtureSource.name
    : lang === 'de'
      ? 'Fallback-Daten'
      : lang === 'pt'
        ? 'Dados fallback'
        : 'Fallback data'

  return (
    <nav className="py-2">
      <div className="px-4 pt-3 pb-2">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted">
          World Cup 2026
        </p>
        <p className={`mt-1 text-[10px] ${fixtureSource.isLive ? 'text-positive' : 'text-accent'}`}>
          {sourceLabel}
        </p>
      </div>

      <ul className="space-y-0.5">
        {visible.map(match => {
          const home = teams[match.homeTeam]
          const away = teams[match.awayTeam]
          const isActive = match.id === activeId
          const matchDate = new Date(match.date)
          const isPast = matchDate < new Date()
          const isResolved = Boolean(home && away && !home.isPlaceholder && !away.isPlaceholder)
          const itemClass = `
            flex flex-col px-4 py-2.5 border-l-2 transition-all
            ${isActive
              ? 'border-accent bg-accent/5 text-text-primary'
              : isResolved
                ? 'border-transparent text-text-muted hover:text-text-primary hover:bg-background'
                : 'border-transparent text-text-muted/70'
            }
          `
          const content = (
            <>
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
                {!isResolved && (
                  <span className="ml-1">
                    · {lang === 'de' ? 'noch offen' : lang === 'pt' ? 'em aberto' : 'pending'}
                  </span>
                )}
              </span>
            </>
          )

          return (
            <li key={match.id}>
              {isResolved ? (
                <Link href={`/${lang}/match/${match.id}`} className={itemClass}>
                  {content}
                </Link>
              ) : (
                <div className={itemClass} aria-disabled="true">
                  {content}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
