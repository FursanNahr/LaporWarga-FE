import { defineStore } from 'pinia'
import { notifikasiApi } from '@/api/notifikasi.api'

// Store ini hanya menyimpan jumlah notifikasi belum dibaca (untuk badge di navbar).
// Daftar notifikasinya dimuat oleh NotifikasiList lewat usePagination.
export const useNotifikasiStore = defineStore('notifikasi', {
  state: () => ({
    unreadCount: 0,
  }),
  actions: {
    // meta.unreadCount selalu berisi total belum dibaca, jadi cukup minta 1 item.
    async fetchUnreadCount() {
      try {
        const { data: body } = await notifikasiApi.list({ limit: 1 })
        this.unreadCount = body.meta?.unreadCount ?? 0
      } catch {
        // Badge tidak boleh mengganggu halaman: error jaringan atau 401 (sudah ditangani interceptor) diabaikan.
      }
    },

    setUnreadCount(count) {
      this.unreadCount = Math.max(0, Number(count) || 0)
    },

    decrement() {
      this.unreadCount = Math.max(0, this.unreadCount - 1)
    },

    reset() {
      this.unreadCount = 0
    },
  },
})