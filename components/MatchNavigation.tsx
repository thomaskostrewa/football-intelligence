'use client'

import { useMemo, useState } from 'react'
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

const localeFor = (lang: Lang) => lang === 'de' ? 'de-DE' : lang === 'pt' ? 'pt-PT' : 'en-GB'

function labelsFor(lang: Lang) {
  if (lang === 'de') {
    return {
      allMatches: 'Alle Spiele',
      laterRounds: 'Spätere KO-Runden',
      pending: 'noch offen',
      close: 'Schließen',
      changeMatch: 'Spiel wechseln',
      matches: 'Spiele',
    }
  }

  if (lang === 'pt') {
    return {
      allMatches: 'Todos os Jogos',
      laterRounds: 'Rondas posteriores',
      pending: 'em aberto',
      close: 'Fechar',
      changeMatch: 'Mudar jogo',
      matches: 'jogos',
    }
  }

  return {
    allMatches: 'All Matches',
    laterRounds: 'Later knockout rounds',
    pending: 'pending',
    close: 'Close',
    changeMatch: 'Change match',
    matches: 'matches',
  }
}

export default function MatchNavigation({ matches, teams, activeId, lang, fixtureSource }: Props) {
  const visible = matches
  const [isOpen, setIsOpen] = useState(false)
  const [showPending, setShowPending] = useState(false)
  const labels = labelsFor(lang)
  const sourceLabel = fixtureSource.isLive
    ? fixtureSource.name
    : lang === 'de'
      ? 'Fallback-Daten'
      : lang === 'pt'
        ? 'Dados fallback'
        : 'Fallback data'
  const activeMatch = visible.find(match => match.id === activeId) ?? visible[0]
  const activeHome = activeMatch ? teams[activeMatch.homeTeam] : null
  const activeAway = activeMatch ? teams[activeMatch.awayTeam] : null
  const activeDate = activeMatch ? new Date(activeMatch.date) : null

  const resolvedMatches = visible.filter(match => {
    const home = teams[match.homeTeam]
    const away = teams[match.awayTeam]
    return Boolean(home && away && !home.isPlaceholder && !away.isPlaceholder)
  })

  const pendingMatches = visible.filter(match => {
    const home = teams[match.homeTeam]
    const away = teams[match.awayTeam]
    return !Boolean(home && away && !home.isPlaceholder && !away.isPlaceholder)
  })

  const groupedResolvedMatches = useMemo(() => {
    return resolvedMatches.reduce<Array<{ key: string; label: string; matches: Match[] }>>((groups, match) => {
      const matchDate = new Date(match.date)
      const key = matchDate.toISOString().slice(0, 10)
      const existing = groups.find(group => group.key === key)

      if (existing) {
        existing.matches.push(match)
      } else {
        groups.push({
          key,
          label: matchDate.toLocaleDateString(localeFor(lang), {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
          }),
          matches: [match],
        })
      }

      return groups
    }, [])
  }, [resolvedMatches, lang])

  function matchTime(match: Match) {
    return new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function matchDateLabel(match: Match) {
    return new Date(match.date).toLocaleDateString(localeFor(lang), {
      day: '2-digit',
      month: '2-digit',
    })
  }

  function renderDesktopMatch(match: Match) {
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
          {matchDateLabel(match)} · {matchTime(match)}
          {!isResolved && (
            <span className="ml-1">
              · {labels.pending}
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
  }

  function renderSheetMatch(match: Match, isPending = false) {
    const home = teams[match.homeTeam]
    const away = teams[match.awayTeam]
    const isActive = match.id === activeId
    const content = (
      <>
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-sm font-medium ${isPending ? 'text-text-muted' : 'text-text-primary'}`}>
            {home?.flag} {home?.name[lang]}
          </span>
          <span className="block truncate text-sm text-text-muted">
            {away?.flag} {away?.name[lang]}
          </span>
        </span>
        <span className="shrink-0 text-right text-[11px] text-text-muted">
          <span className="block">{matchTime(match)}</span>
          <span className="block">{isPending ? labels.pending : matchDateLabel(match)}</span>
        </span>
      </>
    )

    if (isPending) {
      return (
        <div
          key={match.id}
          className="flex items-center gap-3 rounded-lg border border-border bg-background/70 px-3 py-2.5 opacity-80"
          aria-disabled="true"
        >
          {content}
        </div>
      )
    }

    return (
      <Link
        key={match.id}
        href={`/${lang}/match/${match.id}`}
        onClick={() => setIsOpen(false)}
        className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
          isActive
            ? 'border-accent bg-accent/10'
            : 'border-border bg-card hover:border-accent/60'
        }`}
      >
        {content}
      </Link>
    )
  }

  return (
    <>
      <div className="lg:hidden border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted">
              World Cup 2026 · <span className={fixtureSource.isLive ? 'text-positive' : 'text-accent'}>{sourceLabel}</span>
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-text-primary">
              {activeHome?.flag} {activeHome?.name[lang]} vs {activeAway?.flag} {activeAway?.name[lang]}
            </p>
            {activeDate && (
              <p className="mt-0.5 text-[11px] text-text-muted">
                {matchDateLabel(activeMatch)} · {matchTime(activeMatch)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="shrink-0 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-text-primary transition-colors hover:border-accent"
            aria-haspopup="dialog"
            aria-expanded={isOpen}
          >
            {labels.allMatches} ⌄
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={labels.changeMatch}>
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-text-primary/35"
            onClick={() => setIsOpen(false)}
            aria-label={labels.close}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-hidden rounded-t-2xl border border-border bg-background shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted">World Cup 2026</p>
                  <h2 className="text-base font-semibold text-text-primary">{labels.allMatches}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-text-primary"
                >
                  {labels.close}
                </button>
              </div>
            </div>

            <div className="max-h-[calc(82vh-78px)] space-y-5 overflow-y-auto px-4 py-4">
              {groupedResolvedMatches.map(group => (
                <section key={group.key} className="space-y-2">
                  <h3 className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
                    {group.label}
                  </h3>
                  <div className="space-y-2">
                    {group.matches.map(match => renderSheetMatch(match))}
                  </div>
                </section>
              ))}

              {pendingMatches.length > 0 && (
                <section className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowPending(value => !value)}
                    className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 text-left"
                    aria-expanded={showPending}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-text-primary">{labels.laterRounds}</span>
                      <span className="block text-[11px] text-text-muted">{pendingMatches.length} {labels.matches}</span>
                    </span>
                    <span className="text-sm text-text-muted">{showPending ? '⌃' : '⌄'}</span>
                  </button>

                  {showPending && (
                    <div className="space-y-2">
                      {pendingMatches.map(match => renderSheetMatch(match, true))}
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      <nav className="hidden py-2 lg:block">
        <div className="px-4 pt-3 pb-2">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-text-muted">
            World Cup 2026
          </p>
          <p className={`mt-1 text-[10px] ${fixtureSource.isLive ? 'text-positive' : 'text-accent'}`}>
            {sourceLabel}
          </p>
        </div>

        <ul className="space-y-0.5">
          {visible.map(match => renderDesktopMatch(match))}
        </ul>
      </nav>
    </>
  )
}
