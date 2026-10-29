import { ROLES } from '@/constants/roles'

// Semua rute di bawah /instansi: wajib login dan role INSTANSI (dicek di router/index.js).
export default {
  path: '/instansi',
  component: () => import('@/layouts/DashboardLayout.vue'),
  meta: { requiresAuth: true, roles: [ROLES.INSTANSI] },
  children: [
    { path: '', redirect: { name: 'instansi-daftar-laporan' } },
    {
      path: 'laporan',
      name: 'instansi-daftar-laporan',
      component: () => import('@/pages/instansi/DaftarLaporanPage.vue'),
    },
    {
      path: 'laporan/:id',
      name: 'instansi-kelola-progress',
      component: () => import('@/pages/instansi/KelolaProgressPage.vue'),
    },
    {
      path: 'notifikasi',
      name: 'instansi-notifikasi',
      component: () => import('@/pages/instansi/NotifikasiPage.vue'),
    },
    // { path: 'profil', name: 'instansi-profil', component: () => import('@/pages/instansi/ProfilPage.vue') },
  ],
}