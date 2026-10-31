import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import publikRoutes from './routes/publik.routes'
import wargaRoutes from './routes/warga.routes'
import instansiRoutes from './routes/instansi.routes'
import adminRoutes from './routes/admin.routes'

const router = createRouter({
  history: createWebHistory(),
  routes: [...publikRoutes, wargaRoutes, instansiRoutes, adminRoutes],
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

  // to.meta = gabungan meta parent + child, jadi meta di rute induk (mis. /warga) ikut berlaku
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'masuk', query: { redirect: to.fullPath } }
  }

  // Salah role (mis. warga membuka halaman admin) -> kembali ke beranda
  if (to.meta.roles && !to.meta.roles.includes(auth.role)) return { name: 'beranda' }
})

export default router