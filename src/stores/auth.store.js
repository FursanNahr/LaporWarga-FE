import { defineStore } from 'pinia'
import { authApi } from '@/api/auth.api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
    // BE: 'WARGA' | 'INSTANSI' | 'ADMIN'  ->  FE: 'warga' | 'instansi' | 'admin'
    role: (s) => s.user?.role?.toLowerCase() ?? 'publik',
  },
  actions: {
    // Dipakai login & register supaya tidak menulis 4 baris yang sama dua kali
    setSession(token, user) {
      this.token = token
      this.user = user
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    },

    // Response BE: { success, message, data: { user, token } }
    async login(credentials) {
      const { data: body } = await authApi.login(credentials)
      this.setSession(body.data.token, body.data.user)
    },

    // BE juga mengembalikan token saat register, jadi langsung login.
    // confirmPassword tidak ikut dikirim (BE tidak mengenalnya).
    async register({ name, email, password }) {
      const { data: body } = await authApi.register({ name, email, password })
      this.setSession(body.data.token, body.data.user)
    },

    // Response BE: { success, message, data: <user> }  (data = user langsung)
    async fetchMe() {
      try {
        const { data: body } = await authApi.me()
        this.user = body.data
        localStorage.setItem('user', JSON.stringify(body.data))
      } catch {
        // 401 sudah ditangani interceptor (logout otomatis); error jaringan diabaikan
      }
    },

    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
  },
})