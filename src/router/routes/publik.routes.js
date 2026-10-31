// Semua rute publik dibungkus PublicLayout (navbar + footer).
// Halaman di `children` dirender di <RouterView /> milik layout.
//
// Aturan: SELALU beri `name` pada route, lalu pakai :to="{ name: '...' }"
// di RouterLink. Jadi kalau path berubah, link tidak perlu diedit.
//
// meta.guestOnly: hanya untuk yang belum login (dicek di router/index.js).
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
        // (\\d+) = id harus angka
        path: 'laporan/:id(\\d+)',
        name: 'detail-laporan',
        component: () => import('@/pages/publik/DetailLaporanPage.vue'),
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
        meta: { guestOnly: true },
      },
      {
        path: 'daftar',
        name: 'daftar',
        component: () => import('@/pages/publik/DaftarPage.vue'),
        meta: { guestOnly: true },
      },
    ],
  },
]
