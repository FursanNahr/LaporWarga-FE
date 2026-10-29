// Nilai harus sama persis dengan enum ReportStatus di BE (schema.prisma).
export const REPORT_STATUS = {
  MENUNGGU_VERIFIKASI: 'MENUNGGU_VERIFIKASI',
  TERVERIFIKASI: 'TERVERIFIKASI',
  DITOLAK: 'DITOLAK',
  DITERUSKAN: 'DITERUSKAN',
  DALAM_PENANGANAN: 'DALAM_PENANGANAN',
  SELESAI: 'SELESAI',
}

// Label tampilan + variant warna untuk BaseBadge
export const STATUS_META = {
  [REPORT_STATUS.MENUNGGU_VERIFIKASI]: { label: 'Menunggu Verifikasi', variant: 'warning' },
  [REPORT_STATUS.TERVERIFIKASI]: { label: 'Terverifikasi', variant: 'info' },
  [REPORT_STATUS.DITOLAK]: { label: 'Ditolak', variant: 'danger' },
  [REPORT_STATUS.DITERUSKAN]: { label: 'Diteruskan', variant: 'info' },
  [REPORT_STATUS.DALAM_PENANGANAN]: { label: 'Dalam Penanganan', variant: 'primary' },
  [REPORT_STATUS.SELESAI]: { label: 'Selesai', variant: 'success' },
}

export const ALL_STATUSES = Object.values(REPORT_STATUS)

// Cermin PUBLIC_REPORT_STATUSES di BE (config/constants.js):
// hanya status ini yang tampil di feed publik.
export const PUBLIC_STATUSES = [
  REPORT_STATUS.TERVERIFIKASI,
  REPORT_STATUS.DITERUSKAN,
  REPORT_STATUS.DALAM_PENANGANAN,
  REPORT_STATUS.SELESAI,
]