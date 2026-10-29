// Helper tampilan untuk nilai yang datang dari BE (status, enum, jarak, pelapor).
import { STATUS_META } from '@/constants/status'

/** 'DALAM_PENANGANAN' -> 'Dalam Penanganan' (untuk enum yang belum punya label khusus) */
export const humanizeEnum = (value) =>
  value
    ? String(value)
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : '-'

export const statusLabel = (status) => STATUS_META[status]?.label ?? humanizeEnum(status)

export const statusVariant = (status) => STATUS_META[status]?.variant ?? 'neutral'

/** 850 -> '850 m', 2300 -> '2,3 km' */
export const formatDistance = (meters) => {
  if (meters === null || meters === undefined) return ''
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`
}

/**
 * Nama pelapor yang aman ditampilkan.
 * BE sudah mengirim `reporter: null` untuk laporan anonim kecuali untuk pemilik dan admin,
 * tapi tetap tampil "Anonim" selama isAnonymous true.
 */
export const formatReporter = (report) => {
  if (report.isAnonymous) return report.viewer?.isOwner ? 'Anonim (Anda)' : 'Anonim'
  return report.reporter?.name ?? 'Warga'
}