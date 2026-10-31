import { ROLES } from '@/constants/roles'

// Semua rute di bawah /admin: wajib login dan role ADMIN (dicek di router/index.js).
// Nama route dipakai juga oleh AppSidebar.vue dan useAuth.js.
export default {
  path: '/admin',
  component: () => import('@/layouts/DashboardLayout.vue'),
  meta: { requiresAuth: true, roles: [ROLES.ADMIN] },
  children: [
    { path: '', redirect: { name: 'admin-dashboard' } },
    { path: 'dashboard', name: 'admin-dashboard', component: () => import('@/pages/admin/DashboardPage.vue') },
    { path: 'verifikasi', name: 'admin-verifikasi-laporan', component: () => import('@/pages/admin/VerifikasiLaporanPage.vue') },
    { path: 'laporan', name: 'admin-kelola-laporan', component: () => import('@/pages/admin/KelolaLaporanPage.vue') },
    { path: 'laporan/:id', name: 'admin-detail-laporan', component: () => import('@/pages/admin/DetailLaporanAdminPage.vue') },
    { path: 'komentar', name: 'admin-moderasi-komentar', component: () => import('@/pages/admin/ModerasiKomentarPage.vue') },
    { path: 'instansi', name: 'admin-data-instansi', component: () => import('@/pages/admin/DataInstansiPage.vue') },
    { path: 'master', name: 'admin-data-master', component: () => import('@/pages/admin/DataMasterPage.vue') },
    { path: 'sla', name: 'admin-pengaturan-sla', component: () => import('@/pages/admin/PengaturanSlaPage.vue') },
    { path: 'audit', name: 'admin-log-audit', component: () => import('@/pages/admin/LogAuditPage.vue') },
    { path: 'notifikasi', name: 'admin-notifikasi', component: () => import('@/pages/admin/NotifikasiPage.vue') },
  ],
}