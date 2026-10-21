import { createRouter, createWebHistory } from 'vue-router'
import publikRoutes from './routes/publik.routes'

// Rute role lain (warga, instansi, admin) ditambahkan nanti dengan pola yang sama:
// import wargaRoutes from './routes/warga.routes'  ->  ...wargaRoutes

const router = createRouter({
  history: createWebHistory(),
  routes: [...publikRoutes],
  scrollBehavior: () => ({ top: 0 }),
})

export default router