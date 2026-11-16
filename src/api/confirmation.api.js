import api from './index'

// BE menolak query kosong, jadi buang nilai kosong sebelum dikirim.
const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )

export const confirmationApi = {
  // Publik: riwayat konfirmasi & sanggahan sebuah laporan (urut lama -> baru).
  list: (reportId) => api.get(`/reports/${reportId}/confirmations`),

  // Pelapor. formData: result ('SUDAH_BERES' | 'BELUM_BERES'), note, dan file di field `photos`.
  // BELUM_BERES wajib note (min. 10 karakter) dan minimal 1 foto (maks. 4).
  // Content-Type harus multipart karena default instance adalah application/json.
  submit: (reportId, formData) =>
    api.post(`/reports/${reportId}/confirmation`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    }),

  // ---- Admin ----
  // Daftar laporan berstatus DISANGGAH. params: { cursor, limit }
  listDisputes: (params) => api.get('/admin/disputes', { params: clean(params) }),

  // Keputusan admin. reportId = id laporan. payload: { decision: 'REOPEN' | 'CLOSE', reason }
  resolveDispute: (reportId, payload) => api.patch(`/admin/disputes/${reportId}/resolve`, payload),
}
