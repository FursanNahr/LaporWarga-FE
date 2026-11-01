import api from './index'

// type: 'upvote' (dukung) atau 'verify' (verifikasi bahwa masalahnya benar ada).
// Hanya akun warga yang sudah login. Kedua fungsi mengembalikan state terbaru di body.data:
//   { stats: { upvotes, verifications }, viewer: { hasUpvoted, hasVerified } }
export const supportApi = {
  add: (reportId, type) => api.put(`/reports/${reportId}/support/${type}`),
  remove: (reportId, type) => api.delete(`/reports/${reportId}/support/${type}`),
}
