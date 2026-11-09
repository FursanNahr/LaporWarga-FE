import api from './index'

// Bentuk response daftar dari BE: { success, message, data, meta }.
// Dibaca defensif: `data` bisa berupa array langsung, atau objek { items, meta }.
export const parseCommentList = (body) => {
  const data = body?.data
  const items = Array.isArray(data) ? data : (data?.items ?? [])
  const meta = body?.meta ?? data?.meta ?? {}
  return { items, meta }
}

// Nilai undefined di `params` otomatis tidak dikirim axios, jadi tidak perlu clean().
export const komentarApi = {
  // Komentar utama (terbaru dulu) + replyCount + beberapa balasan terbaru.
  // params: { cursor, limit }
  list: (reportId, params) => api.get(`/reports/${reportId}/comments`, { params }),

  // Balasan satu komentar (terlama dulu). params: { cursor, limit }
  replies: (commentId, params) => api.get(`/comments/${commentId}/replies`, { params }),

  // formData: body, kind, parentId (opsional), dan file di field `files` (foto/video).
  // Content-Type multipart wajib (lihat catatan di laporan.api.js).
  // Timeout panjang karena video bisa sampai 25 MB per file.
  create: (reportId, formData, { onUploadProgress } = {}) =>
    api.post(`/reports/${reportId}/comments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
      onUploadProgress,
    }),

  // Khusus admin (moderasi). Dipakai ModerasiKomentarPage, bukan halaman Detail.
  remove: (commentId) => api.delete(`/comments/${commentId}`),
}