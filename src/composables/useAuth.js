import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

// Rute "rumah" tiap role setelah login. Key = hasil getter `role` di auth.store.
// Rute yang belum dibuat otomatis jatuh ke 'beranda' (lihat homeRoute),
// jadi saat warga.routes.js dst. dibuat, pakai NAME route di bawah ini.
const ROLE_HOME = {
  warga: 'warga-feed',
  instansi: 'instansi-daftar-laporan',
  admin: 'admin-verifikasi-laporan',
}

/**
 * Store menyimpan STATE (token, user, role).
 * Composable ini menyimpan ALUR yang melibatkan router: login -> pindah halaman, logout -> pindah halaman.
 */
export function useAuth() {
  const store = useAuthStore()
  const router = useRouter()
  const route = useRoute()

  const user = computed(() => store.user)
  const role = computed(() => store.role)
  const isLoggedIn = computed(() => store.isLoggedIn)

  const homeRoute = () => {
    const name = ROLE_HOME[store.role]
    return name && router.hasRoute(name) ? { name } : { name: 'beranda' }
  }

  // Hanya terima path internal (/...) agar ?redirect= tidak bisa dipakai membelokkan ke situs lain
  const safeRedirect = () => {
    const target = route.query.redirect
    return typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') ? target : null
  }

  async function login(credentials) {
    await store.login(credentials)
    await router.push(safeRedirect() ?? homeRoute())
  }

  async function register(payload) {
    await store.register(payload)
    await router.push(homeRoute())
  }

  async function logout() {
    store.logout()
    await router.push({ name: 'beranda' })
  }

  return { user, role, isLoggedIn, login, register, logout }
}