// Formatter untuk angka statistik dari BE. Nilai null berarti "belum ada data", ditampilkan sebagai '-'.
const isEmpty = (value) => value === null || value === undefined

const decimal = (value) => String(value).replace('.', ',')

export const formatNumber = (value) => (isEmpty(value) ? '-' : Number(value).toLocaleString('id-ID'))

export const formatPercent = (value) => (isEmpty(value) ? '-' : `${value}%`)

export const formatDays = (value) => (isEmpty(value) ? '-' : `${decimal(value)} hari`)

/** 5.5 -> '5,5 jam', 72 -> '3 hari' (di atas 48 jam ditampilkan dalam hari) */
export const formatHours = (value) => {
  if (isEmpty(value)) return '-'
  if (value < 48) return `${decimal(value)} jam`
  return formatDays(Math.round((value / 24) * 10) / 10)
}