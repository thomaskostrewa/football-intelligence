type CacheEntry<T> = {
  expiresAt: number
  value: T
}

const cache = new Map<string, CacheEntry<unknown>>()

export async function cached<T>(
  key: string,
  ttlMs: number,
  refresh: boolean,
  loader: () => Promise<T>
): Promise<T> {
  const now = Date.now()
  const hit = cache.get(key) as CacheEntry<T> | undefined

  if (!refresh && hit && hit.expiresAt > now) return hit.value

  const value = await loader()
  cache.set(key, { value, expiresAt: now + ttlMs })
  return value
}
