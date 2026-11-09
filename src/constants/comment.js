// Samakan dengan BE: prisma enum CommentKind dan src/config/constants.js (COMMENT, UPLOAD.COMMENT_FILES).
// Kalau batas di BE berubah, ubah di sini saja.

export const COMMENT_KIND = {
  KOMENTAR: 'KOMENTAR',
  BUKTI_PENDUKUNG: 'BUKTI_PENDUKUNG',
  LAPORAN_LAIN: 'LAPORAN_LAIN',
  SANGGAHAN: 'SANGGAHAN',
}

export const COMMENT_KIND_OPTIONS = [
  { value: COMMENT_KIND.KOMENTAR, label: 'Komentar' },
  { value: COMMENT_KIND.BUKTI_PENDUKUNG, label: 'Bukti pendukung' },
  { value: COMMENT_KIND.LAPORAN_LAIN, label: 'Laporan lain' },
  { value: COMMENT_KIND.SANGGAHAN, label: 'Sanggahan' },
]

export const COMMENT_KIND_LABEL = Object.fromEntries(
  COMMENT_KIND_OPTIONS.map(({ value, label }) => [value, label]),
)

export const COMMENT_LIMITS = {
  MAX_BODY_LENGTH: 2000,
  MAX_FILES: 4, // total per komentar (foto + video)
  IMAGE_MAX_MB: 5,
  VIDEO_MAX_MB: 25,
  PAGE_SIZE: 10, // komentar utama per halaman
  REPLY_PAGE_SIZE: 10, // balasan per halaman saat "Lihat balasan lainnya"
}

export const COMMENT_ACCEPTED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
}