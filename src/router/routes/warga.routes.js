import { ROLES } from '@/constants/roles'

// Semua rute di bawah /warga: wajib login dan role WARGA (dicek di router/index.js).
export default {
  path: '/warga',
  component: () => import('@/layouts/DashboardLayout.vue'),
  meta: { requiresAuth: true, roles: [ROLES.WARGA] },
  children: [
    // Sementara ke Laporan Saya; ganti ke 'warga-feed' saat FeedPage dibuat
    { path: '', redirect: { name: 'warga-laporan-saya' } },
    { path: 'buat-laporan', name: 'warga-buat-laporan', component: () => import('@/pages/warga/BuatLaporanPage.vue') },
    { path: 'laporan-saya', name: 'warga-laporan-saya', component: () => import('@/pages/warga/LaporanSayaPage.vue') },
    // { path: 'feed', name: 'warga-feed', component: () => import('@/pages/warga/FeedPage.vue') },
    // { path: 'notifikasi', name: 'warga-notifikasi', component: () => import('@/pages/warga/NotifikasiPage.vue') },
    // { path: 'profil', name: 'warga-profil', component: () => import('@/pages/warga/ProfilPage.vue') },
  ],
}