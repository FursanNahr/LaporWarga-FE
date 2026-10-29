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