const EARTH_RADIUS_M = 6371000

const toRad = (degrees) => (Number(degrees) * Math.PI) / 180

/**
 * Jarak dua titik dalam meter (haversine). Titik = { latitude, longitude }.
 * Hanya untuk umpan balik cepat di FE; BE tetap yang memutuskan (utils/geo.js di BE).
 */
export const distanceInMeters = (a, b) => {
  const dLat = toRad(b.latitude) - toRad(a.latitude)
  const dLng = toRad(b.longitude) - toRad(a.longitude)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}