import { ROLES } from '@/constants/roles'

export default {
  path: '/warga',
  component: () => import('@/layouts/DashboardLayout.vue'),
  meta: { requiresAuth: true, roles: [ROLES.WARGA] },
  children: [
    { path: '', redirect: { name: 'warga-feed' } },
    // { path: 'buat-laporan', name: 'warga-buat-laporan', component: () => import('@/pages/warga/BuatLaporanPage.vue') },
    // { path: 'laporan-saya', name: 'warga-laporan-saya', component: () => import('@/pages/warga/LaporanSayaPage.vue') },
    // { path: 'feed', name: 'warga-feed', component: () => import('@/pages/warga/FeedPage.vue') },
    // { path: 'notifikasi', name: 'warga-notifikasi', component: () => import('@/pages/warga/NotifikasiPage.vue') },
    // { path: 'profil', name: 'warga-profil', component: () => import('@/pages/warga/ProfilPage.vue') },
  ],
}