import api from './index'

// BE menolak query kosong, jadi buang nilai kosong sebelum dikirim (pola sama dengan admin.api.js).
const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )

// Semua endpoint publik (tanpa login). params: { range: 'bulan-ini' | '30-hari' | 'semua', dateFrom, dateTo, limit }
export const statsApi = {
  overview: () => api.get('/stats/overview'),
  citizens: (params) => api.get('/stats/citizens', { params: clean(params) }),
  agencies: (params) => api.get('/stats/agencies', { params: clean(params) }),
  admins: (params) => api.get('/stats/admins', { params: clean(params) }),
}