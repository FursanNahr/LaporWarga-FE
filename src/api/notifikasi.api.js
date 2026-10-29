import api from './index'

export const notifikasiApi = {
  // params: { cursor, limit, unread }
  // Response: data = daftar notifikasi, meta = { limit, hasMore, nextCursor, unreadCount }
  list: ({ cursor, limit, unread } = {}) =>
    api.get('/notifications', {
      // BE menolak nilai kosong; axios membuang undefined dan null dari query string.
      params: { cursor: cursor || undefined, limit, unread: unread ? 'true' : undefined },
    }),

  markRead: (id) => api.patch(`/notifications/${id}/read`),

  markAllRead: () => api.patch('/notifications/read-all'),
}