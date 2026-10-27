import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import publikRoutes from './routes/publik.routes'

// Rute role lain (warga, instansi, admin) ditambahkan nanti dengan pola yang sama:
// import wargaRoutes from './routes/warga.routes'  ->  ...wargaRoutes

const router = createRouter({
  history: createWebHistory(),
  routes: [...publikRoutes],
  scrollBehavior: () => ({ top: 0 }),
})

let sessionChecked = false

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Sekali saja saat app dibuka: validasi token lewat GET /auth/me
  if (!sessionChecked) {
    sessionChecked = true
    if (auth.token) await auth.fetchMe()
  }

  // Yang sudah login tidak perlu melihat form masuk/daftar lagi
  if (to.meta.guestOnly && auth.isLoggedIn) return { name: 'beranda' }
})

export default router