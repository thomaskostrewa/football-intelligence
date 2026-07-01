'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type TimezoneId = 'Europe/Berlin' | 'America/Sao_Paulo'

type TimezoneOption = {
  id: TimezoneId
  label: string
  shortLabel: string
}

const options: TimezoneOption[] = [
  { id: 'Europe/Berlin', label: 'Berlin', shortLabel: 'BER' },
  { id: 'America/Sao_Paulo', label: 'Sao Paulo', shortLabel: 'SAO' },
]

type TimezoneContextValue = {
  timezone: TimezoneId
  timezoneLabel: string
  options: TimezoneOption[]
  setTimezone: (timezone: TimezoneId) => void
}

const TimezoneContext = createContext<TimezoneContextValue | null>(null)

export function TimezoneProvider({ children }: { children: React.ReactNode }) {
  const [timezone, setTimezoneState] = useState<TimezoneId>('Europe/Berlin')

  useEffect(() => {
    const saved = window.localStorage.getItem('football-intelligence-timezone')
    if (saved === 'Europe/Berlin' || saved === 'America/Sao_Paulo') {
      setTimezoneState(saved)
    }
  }, [])

  function setTimezone(nextTimezone: TimezoneId) {
    setTimezoneState(nextTimezone)
    window.localStorage.setItem('football-intelligence-timezone', nextTimezone)
  }

  const value = useMemo(() => {
    const selected = options.find(option => option.id === timezone) ?? options[0]

    return {
      timezone,
      timezoneLabel: selected.label,
      options,
      setTimezone,
    }
  }, [timezone])

  return <TimezoneContext.Provider value={value}>{children}</TimezoneContext.Provider>
}

export function useTimezone() {
  const value = useContext(TimezoneContext)
  if (!value) {
    return {
      timezone: 'Europe/Berlin' as TimezoneId,
      timezoneLabel: 'Berlin',
      options,
      setTimezone: () => undefined,
    }
  }

  return value
}

export function TimezoneToggle() {
  const { timezone, options, setTimezone } = useTimezone()

  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-background p-0.5 text-[11px]" aria-label="Zeitzone">
      {options.map(option => {
        const active = option.id === timezone

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setTimezone(option.id)}
            className={`h-7 px-2.5 rounded-md font-semibold transition-colors ${
              active
                ? 'bg-card text-text-primary shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
            title={`Zeiten in ${option.label} anzeigen`}
          >
            {option.shortLabel}
          </button>
        )
      })}
    </div>
  )
}
