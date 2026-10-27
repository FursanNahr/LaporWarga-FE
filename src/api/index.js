import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'
import router from '@/router'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Request: otomatis tempel token
api.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) config.headers.Authorization = `Bearer ${auth.token}`
  return config
})

// BE mengirim error validasi (422) sebagai [{ location, field, message }].
// Diubah jadi { email: 'pesan', password: 'pesan' } supaya langsung bisa dipasang ke input.
const toFieldErrors = (errors) => {
  if (!Array.isArray(errors)) return {}
  return errors.reduce((acc, { field, message }) => {
    if (field && !acc[field]) acc[field] = message
    return acc
  }, {})
}

// Response: sesi habis -> logout, dan rapikan bentuk error
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status
    const auth = useAuthStore()

    // 401 + sudah punya token = token kedaluwarsa/tidak valid -> keluar.
    // 401 TANPA token (mis. "Email atau password salah" saat login) jangan redirect,
    // supaya pesan errornya sempat tampil di form.
    if (status === 401 && auth.token) {
      auth.logout()
      router.push({ name: 'masuk' })
    }

    // Dipakai halaman lewat e.normalized (message untuk alert, fieldErrors untuk per input)
    error.normalized = {
      status,
      message:
        error.response?.data?.message ??
        (error.response ? 'Terjadi kesalahan pada server' : 'Tidak dapat terhubung ke server'),
      fieldErrors: toFieldErrors(error.response?.data?.errors),
    }
    return Promise.reject(error)
  }
)

export default api