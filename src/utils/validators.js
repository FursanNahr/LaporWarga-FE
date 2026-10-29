// Cermin dari validators/auth.validator.js di BE (pesannya sengaja sama).
// Ini hanya untuk umpan balik cepat; BE tetap sumber kebenaran.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateLogin({ email, password }) {
  const errors = {}
  if (!EMAIL_RE.test(email.trim())) errors.email = 'Email tidak valid'
  if (!password) errors.password = 'Password wajib diisi'
  return errors
}

export function validateRegister({ name, email, password, confirmPassword }) {
  const errors = {}
  const n = name.trim()
  if (n.length < 2) errors.name = 'Nama minimal 2 karakter'
  else if (n.length > 100) errors.name = 'Nama maksimal 100 karakter'
  if (!EMAIL_RE.test(email.trim())) errors.email = 'Email tidak valid'
  if (password.length < 8) errors.password = 'Password minimal 8 karakter'
  else if (password.length > 72) errors.password = 'Password maksimal 72 karakter'
  if (confirmPassword !== password) errors.confirmPassword = 'Konfirmasi password tidak sama'
  return errors
}

// ---------------------------------------------------------------------------
// Laporan. Cermin createReportBody (BE) dan UPLOAD.REPORT_PHOTOS di config/constants.js.
// ---------------------------------------------------------------------------
export const REPORT_PHOTO = {
  maxFiles: 5,
  maxSizeMB: 5,
  types: ['image/jpeg', 'image/png', 'image/webp'],
}

/** Cek satu file foto. Mengembalikan pesan error, atau '' kalau valid. */
export function validatePhotoFile(file) {
  if (!REPORT_PHOTO.types.includes(file.type)) return 'Format foto harus JPG, PNG, atau WEBP'
  if (file.size > REPORT_PHOTO.maxSizeMB * 1024 * 1024) {
    return `Ukuran foto maksimal ${REPORT_PHOTO.maxSizeMB} MB`
  }
  return ''
}

// latitude/longitude diisi sebagai string dari input. String kosong HARUS ditolak di sini:
// BE memakai z.coerce.number(), dan '' akan terbaca sebagai 0 (titik di laut).
const checkCoordinate = (raw, min, max, label) => {
  if (String(raw).trim() === '') return 'Lokasi wajib diisi'
  const value = Number(raw)
  if (!Number.isFinite(value) || value < min || value > max) return `${label} tidak valid`
  return ''
}

export function validateReport({ description, subcategoryId, address, latitude, longitude, photos }) {
  const errors = {}

  const desc = description.trim()
  if (desc.length < 10) errors.description = 'Deskripsi minimal 10 karakter'
  else if (desc.length > 2000) errors.description = 'Deskripsi maksimal 2000 karakter'

  if (!subcategoryId) errors.subcategoryId = 'Pilih subjenis atau instansi'

  if (address.trim().length > 255) errors.address = 'Alamat maksimal 255 karakter'

  const latError = checkCoordinate(latitude, -90, 90, 'Latitude')
  if (latError) errors.latitude = latError
  const lngError = checkCoordinate(longitude, -180, 180, 'Longitude')
  if (lngError) errors.longitude = lngError

  if (photos.length === 0) errors.photos = 'Minimal unggah 1 foto laporan'
  else if (photos.length > REPORT_PHOTO.maxFiles) {
    errors.photos = `Maksimal ${REPORT_PHOTO.maxFiles} foto`
  }

  return errors
}