'use client'

import Link from 'next/link'
import type { Lang } from '@/lib/i18n'
import { t, SUPPORTED_LANGS } from '@/lib/i18n'

interface HeaderProps {
  lang: Lang
  matchId: string
}

const NAV_ITEMS = [
  { key: 'nav_home' as const, href: 'https://thomas-kostrewa.de' },
  { key: 'nav_how' as const, href: 'https://thomas-kostrewa.de/how-i-build' },
  { key: 'nav_upload' as const, href: 'https://thomas-kostrewa.de/upload-monitor' },
  { key: 'nav_football' as const, href: null }, // current page
  { key: 'nav_contact' as const, href: 'https://thomas-kostrewa.de/contact' },
]

export default function Header({ lang, matchId }: HeaderProps) {
  const tr = t[lang]

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border">
      <div className="px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link
          href={`https://thomas-kostrewa.de`}
          className="text-sm font-semibold tracking-widest uppercase text-text-primary hover:text-accent transition-colors shrink-0"
        >
          Thomas Kostrewa
        </Link>

        {/* Nav – hidden on mobile, shown md+ */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map(item => (
            item.href ? (
              <a
                key={item.key}
                href={item.href}
                className="text-sm text-text-muted hover:text-text-primary transition-colors"
              >
                {tr[item.key]}
              </a>
            ) : (
              <span
                key={item.key}
                className="text-sm font-medium text-accent border-b border-accent pb-0.5"
              >
                {tr[item.key]}
              </span>
            )
          ))}
        </nav>

        {/* Language switcher */}
        <div className="flex items-center gap-2 text-sm shrink-0">
          {SUPPORTED_LANGS.map((l, i) => (
            <span key={l} className="flex items-center gap-2">
              {i > 0 && <span className="text-border">|</span>}
              <Link
                href={`/${l}/match/${matchId}`}
                className={l === lang
                  ? 'font-semibold text-text-primary'
                  : 'text-text-muted hover:text-text-primary transition-colors'
                }
              >
                {l.toUpperCase()}
              </Link>
            </span>
          ))}
        </div>
      </div>
    </header>
  )
}
