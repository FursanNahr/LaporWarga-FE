const dateFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const dateTimeFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const toDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** 28 Oktober 2026 */
export const formatDate = (value) => {
  const date = toDate(value)
  return date ? dateFormat.format(date) : '-'
}

/** 28 Okt 2026, 14.05 */
export const formatDateTime = (value) => {
  const date = toDate(value)
  return date ? dateTimeFormat.format(date) : '-'
}

/** Sudah berapa lama sejak waktu itu: 'baru saja', '5 jam', '3 hari'. */
export const formatAge = (value) => {
  const date = toDate(value)
  if (!date) return '-'
  const hours = Math.floor((Date.now() - date.getTime()) / 3600000)
  if (hours < 1) return 'baru saja'
  if (hours < 24) return `${hours} jam`
  return `${Math.floor(hours / 24)} hari`
}
export function timeAgo(iso) {
  const ms = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(ms)) return ''
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'baru saja'
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} hari lalu`
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
