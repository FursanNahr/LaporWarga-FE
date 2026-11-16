import api from './index'

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )

export const instansiApi = {
  listLaporan: (params) => api.get('/reports/agency', { params: clean(params) }),
  kirimProgress: (id, formData) =>
    api.post(`/reports/${id}/progress`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    }),
}