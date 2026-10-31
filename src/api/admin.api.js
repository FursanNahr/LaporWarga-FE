import api from './index'

// BE menolak query kosong (mis. q= atau status=), jadi buang nilai kosong sebelum dikirim.
const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )

// Semua endpoint di sini hanya bisa diakses role ADMIN (BE membalas 403 untuk role lain).
export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),

  // ---- Laporan ----
  // params: { cursor, limit, order, status, agencyId, subcategoryId, districtId, isOverdue, merged, dateFrom, dateTo, q }
  listLaporan: (params) => api.get('/admin/reports', { params: clean(params) }),
  detailLaporan: (id) => api.get(`/admin/reports/${id}`),
  // payload: { action: 'VERIFIKASI' | 'TOLAK' | 'TERUSKAN', reason?, agencyId?, note? }
  verifikasi: (id, payload) => api.post(`/admin/reports/${id}/verification`, payload),
  kandidatDuplikat: (id) => api.get(`/admin/reports/${id}/duplicates`),
  // id = laporan duplikat, payload: { targetId, note? } (targetId = laporan utama)
  gabungLaporan: (id, payload) => api.post(`/admin/reports/${id}/merge`, payload),
  // CSV: diminta sebagai blob supaya token ikut terkirim dan file bisa disimpan.
  eksporLaporan: (params) =>
    api.get('/admin/reports/export', { params: clean(params), responseType: 'blob', timeout: 60000 }),

  // ---- Instansi & akun petugas ----
  listInstansi: (params) => api.get('/admin/agencies', { params: clean(params) }),
  buatInstansi: (payload) => api.post('/admin/agencies', payload),
  ubahInstansi: (id, payload) => api.patch(`/admin/agencies/${id}`, payload),
  listPetugas: (params) => api.get('/admin/staff', { params: clean(params) }),
  buatPetugas: (payload) => api.post('/admin/staff', payload),
  ubahPetugas: (id, payload) => api.patch(`/admin/staff/${id}`, payload),

  // ---- Kategori, subjenis, pemetaan ke instansi ----
  listKategori: () => api.get('/admin/categories'),
  buatKategori: (payload) => api.post('/admin/categories', payload),
  ubahKategori: (id, payload) => api.patch(`/admin/categories/${id}`, payload),
  hapusKategori: (id) => api.delete(`/admin/categories/${id}`),
  buatSubjenis: (categoryId, payload) => api.post(`/admin/categories/${categoryId}/subcategories`, payload),
  ubahSubjenis: (id, payload) => api.patch(`/admin/subcategories/${id}`, payload),
  hapusSubjenis: (id) => api.delete(`/admin/subcategories/${id}`),

  // ---- Moderasi komentar ----
  listKomentar: (params) => api.get('/admin/comments', { params: clean(params) }),
  // payload: { hidden: boolean, reason? } (alasan wajib saat menyembunyikan)
  moderasiKomentar: (id, payload) => api.patch(`/admin/comments/${id}/moderation`, payload),

  // ---- SLA ----
  sla: () => api.get('/admin/sla'),
  simpanSla: (payload) => api.put('/admin/sla', payload), // { settings: [{ stage, maxDays }] }
  cekSla: () => api.post('/admin/sla/check'),

  // ---- Log audit (hanya baca) ----
  logAudit: (params) => api.get('/admin/audit-logs', { params: clean(params) }),
  aksiAudit: () => api.get('/admin/audit-logs/actions'),
}