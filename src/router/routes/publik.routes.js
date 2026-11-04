// Rute publik dibagi dua pembungkus:
//  1) PublicLayout (navbar + footer): halaman biasa.
//  2) AuthLayout (layar penuh, tanpa navbar/footer): Masuk & Daftar.
//
// Aturan: SELALU beri `name` pada route, lalu pakai :to="{ name: '...' }"
// di RouterLink. Jadi kalau path berubah, link tidak perlu diedit.
//
// meta.guestOnly: hanya untuk yang belum login (dicek di router/index.js).
// meta.authVariant: pilih teks + ilustrasi di AuthLayout ('masuk' | 'daftar').
import { useAuthStore } from '@/stores/auth.store'

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
        // Feed boleh dilihat tanpa login. Halaman yang sama juga dipakai di rute
        // 'warga-feed' (router/routes/warga.routes.js) supaya warga melihatnya di dashboard.
        path: 'feed',
        name: 'feed',
        component: () => import('@/pages/publik/FeedPage.vue'),
      },
      {
        path: 'statistik',
        name: 'statistik',
        component: () => import('@/pages/publik/StatistikPage.vue'),
      },
      {
        // (\\d+) = id harus angka
        path: 'laporan/:id(\\d+)',
        name: 'detail-laporan',
        component: () => import('@/pages/publik/DetailLaporanPage.vue'),
        beforeEnter: (to) =>
          useAuthStore().role === 'warga'
            ? { name: 'warga-detail-laporan', params: to.params, query: to.query, hash: to.hash }
            : true,
      },
      {
        path: 'papan-transparansi',
        name: 'papan-transparansi',
        component: () => import('@/pages/publik/PapanTransparansiPage.vue'),
      },
    ],
  },
  {
    // Path tetap /masuk dan /daftar, hanya pembungkusnya yang beda.
    path: '/',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      {
        path: 'masuk',
        name: 'masuk',
        component: () => import('@/pages/publik/MasukPage.vue'),
        meta: { guestOnly: true, authVariant: 'masuk' },
      },
      {
        path: 'daftar',
        name: 'daftar',
        component: () => import('@/pages/publik/DaftarPage.vue'),
        meta: { guestOnly: true, authVariant: 'daftar' },
      },
    ],
  },
]
