import api from './index'

// BE menolak query kosong (mis. q= atau status=), jadi buang nilai kosong sebelum dikirim.
const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )

export const laporanApi = {
  // Feed publik. params: { cursor, limit, status, subcategoryId, q, lat, lng, radius }
  list: (params) => api.get('/reports', { params: clean(params) }),

  // Laporan milik user yang login. params: { cursor, limit, status }
  mine: (params) => api.get('/reports/me', { params: clean(params) }),

  // Detail + timeline. Laporan yang belum publik hanya bisa dibuka pemilik/admin (selain itu 404).
  detail: (id) => api.get(`/reports/${id}`),

  // formData: field teks + file di field `photos`.
  // Content-Type harus multipart: default instance adalah application/json, dan axios 1.x
  // akan mengubah FormData menjadi JSON (file hilang) kalau header itu dibiarkan.
  // Timeout dilonggarkan karena bisa mengunggah sampai 5 foto.
  create: (formData) =>
    api.post('/reports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    }),
}