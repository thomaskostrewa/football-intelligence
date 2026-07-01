export type SourceHealthStatus = 'active' | 'missing-key' | 'no-data' | 'limited' | 'blocked' | 'error' | 'fallback'

export type SourceHealth = {
  status: SourceHealthStatus
  message: string
  checkedAt: string
  quota?: {
    limit?: number
    remaining?: number
    used?: number
    period?: 'day' | 'month' | 'minute'
  }
}

export function sourceHealth(status: SourceHealthStatus, message: string, quota?: SourceHealth['quota']): SourceHealth {
  return {
    status,
    message,
    checkedAt: new Date().toISOString(),
    quota,
  }
}
