import { cached } from './cache'

export type WeatherSignal = {
  temperature?: number
  windSpeed?: number
  rainProbability?: number
  humidity?: number
}

export async function getOpenMeteoForecast(
  coordinates: { latitude?: number; longitude?: number } | undefined,
  kickoff: string,
  refresh = false
): Promise<WeatherSignal | null> {
  if (!coordinates?.latitude || !coordinates.longitude) return null

  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(coordinates.latitude))
  url.searchParams.set('longitude', String(coordinates.longitude))
  url.searchParams.set('hourly', 'temperature_2m,relative_humidity_2m,precipitation_probability,wind_speed_10m')
  url.searchParams.set('forecast_days', '7')

  const payload = await cached(`open-meteo:${coordinates.latitude}:${coordinates.longitude}:${kickoff}`, 60 * 60 * 1000, refresh, async () => {
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Open-Meteo request failed with ${response.status}`)
      return null
    }
    return response.json() as Promise<{
      hourly?: {
        time?: string[]
        temperature_2m?: number[]
        relative_humidity_2m?: number[]
        precipitation_probability?: number[]
        wind_speed_10m?: number[]
      }
    }>
  })

  const times = payload?.hourly?.time ?? []
  if (!times.length) return null

  const kickoffTime = new Date(kickoff).getTime()
  let nearest = 0
  let nearestDelta = Number.POSITIVE_INFINITY
  times.forEach((time, index) => {
    const delta = Math.abs(new Date(time).getTime() - kickoffTime)
    if (delta < nearestDelta) {
      nearest = index
      nearestDelta = delta
    }
  })

  return {
    temperature: payload?.hourly?.temperature_2m?.[nearest],
    windSpeed: payload?.hourly?.wind_speed_10m?.[nearest],
    rainProbability: payload?.hourly?.precipitation_probability?.[nearest],
    humidity: payload?.hourly?.relative_humidity_2m?.[nearest],
  }
}
