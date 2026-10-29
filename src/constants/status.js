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

// Cermin AGENCY_REPORT_STATUSES di BE: status yang tampil di daftar kerja instansi
// (laporan yang sudah diteruskan admin).
export const AGENCY_STATUSES = [
  REPORT_STATUS.DITERUSKAN,
  REPORT_STATUS.DALAM_PENANGANAN,
  REPORT_STATUS.SELESAI,
]

// Cermin INSTANSI_ACTIONS di BE (config/constants.js). Alur selalu maju satu langkah.
export const PROGRESS_ACTION = {
  MULAI_TANGANI: 'MULAI_TANGANI',
  TAMBAH_CATATAN: 'TAMBAH_CATATAN',
  SELESAIKAN: 'SELESAIKAN',
}

export const PROGRESS_ACTIONS = {
  [PROGRESS_ACTION.MULAI_TANGANI]: {
    from: REPORT_STATUS.DITERUSKAN,
    label: 'Mulai tangani',
    description: 'Status berubah menjadi Dalam Penanganan.',
  },
  [PROGRESS_ACTION.TAMBAH_CATATAN]: {
    from: REPORT_STATUS.DALAM_PENANGANAN,
    label: 'Tambah catatan',
    description: 'Status tetap Dalam Penanganan. Catatan dan lampiran masuk ke riwayat.',
  },
  [PROGRESS_ACTION.SELESAIKAN]: {
    from: REPORT_STATUS.DALAM_PENANGANAN,
    label: 'Selesaikan laporan',
    description: 'Wajib foto sesudah yang diambil di lokasi laporan.',
  },
}

/** Aksi yang boleh dilakukan petugas pada sebuah status. SELESAI dan status lain: kosong. */
export const actionsForStatus = (status) =>
  Object.entries(PROGRESS_ACTIONS)
    .filter(([, meta]) => meta.from === status)
    .map(([action]) => action)