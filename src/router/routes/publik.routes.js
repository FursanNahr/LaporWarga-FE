// Semua rute publik dibungkus PublicLayout (navbar + footer).
// Halaman di `children` dirender di <RouterView /> milik layout.
//
// Aturan: SELALU beri `name` pada route, lalu pakai :to="{ name: '...' }"
// di RouterLink. Jadi kalau path berubah, link tidak perlu diedit.
export default [
  {
    path: '/',
    component: () => import('@/layouts/PublicLayout.vue'),
    children: [
      {
        path: '',
        name: 'beranda',
        component: () => import('@/pages/publik/BerandaPage.vue'),
      },
      {
        path: 'cari-laporan',
        name: 'cari-laporan',
        component: () => import('@/pages/publik/CariLaporanPage.vue'),
      },
      {
        path: 'papan-transparansi',
        name: 'papan-transparansi',
        component: () => import('@/pages/publik/PapanTransparansiPage.vue'),
      },
      {
        path: 'masuk',
        name: 'masuk',
        component: () => import('@/pages/publik/MasukPage.vue'),
      },
    ],
  },
]