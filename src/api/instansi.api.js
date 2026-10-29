import api from './index'

// BE menolak query kosong (mis. q= atau status=), jadi buang nilai kosong sebelum dikirim.
const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )

export const instansiApi = {
  // Daftar kerja petugas: hanya laporan milik instansi yang login (DITERUSKAN, DALAM_PENANGANAN, SELESAI).
  // params: { cursor, limit, status, subcategoryId, districtId, q }
  listLaporan: (params) => api.get('/reports/agency', { params: clean(params) }),

  // Detail + timeline memakai laporanApi.detail(id), karena endpoint-nya sama dengan halaman publik.

  // POST /reports/:id/progress
  // formData: action (MULAI_TANGANI | TAMBAH_CATATAN | SELESAIKAN), note, latitude, longitude,
  // dan file di field `photos`, `afterPhotos`, `documents` (maksimal 5 file per request).
  // Content-Type multipart dipasang eksplisit karena default instance adalah application/json.
  kirimProgress: (id, formData) =>
    api.post(`/reports/${id}/progress`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    }),
}