const venueCoordinates = [
  { match: ['seattle'], latitude: 47.6062, longitude: -122.3321 },
  { match: ['miami'], latitude: 25.7617, longitude: -80.1918 },
  { match: ['new york', 'new jersey', 'metlife'], latitude: 40.8135, longitude: -74.0745 },
  { match: ['dallas'], latitude: 32.7473, longitude: -97.0945 },
  { match: ['los angeles'], latitude: 34.0522, longitude: -118.2437 },
  { match: ['san francisco'], latitude: 37.7749, longitude: -122.4194 },
  { match: ['kansas city'], latitude: 39.0997, longitude: -94.5786 },
  { match: ['atlanta'], latitude: 33.7554, longitude: -84.4008 },
  { match: ['houston'], latitude: 29.7604, longitude: -95.3698 },
  { match: ['vancouver'], latitude: 49.2827, longitude: -123.1207 },
  { match: ['toronto'], latitude: 43.6532, longitude: -79.3832 },
  { match: ['philadelphia'], latitude: 39.9526, longitude: -75.1652 },
  { match: ['boston'], latitude: 42.3601, longitude: -71.0589 },
  { match: ['mexico city', 'mexiko-stadt'], latitude: 19.4326, longitude: -99.1332 },
  { match: ['guadalajara'], latitude: 20.6597, longitude: -103.3496 },
  { match: ['monterrey'], latitude: 25.6866, longitude: -100.3161 },
]

function normalizeVenue(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function getVenueCoordinates(venue?: string) {
  if (!venue || /^(tbd|a definir)$/i.test(venue.trim())) return undefined

  const normalized = normalizeVenue(venue)
  const match = venueCoordinates.find(item => item.match.some(name => normalized.includes(normalizeVenue(name))))
  if (!match) return undefined

  return {
    latitude: match.latitude,
    longitude: match.longitude,
  }
}
