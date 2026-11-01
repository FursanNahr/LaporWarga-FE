// URL foto dari BE bersifat relatif (/uploads/...). Tambahkan origin backend di depannya.
const origin = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '')

export const mediaUrl = (path) => {
  if (!path) return ''
  return /^https?:\/\//.test(path) ? path : `${origin}${path}`
}
