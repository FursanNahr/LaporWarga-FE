<script setup>
import { computed } from 'vue'
import { useNotifikasiStore } from '@/stores/notifikasi.store'

/** AppSidebar: menu admin. Dipasang oleh DashboardLayout hanya untuk role admin. */
const notifikasi = useNotifikasiStore()
const badgeText = computed(() => (notifikasi.unreadCount > 99 ? '99+' : String(notifikasi.unreadCount)))

// `to` memakai NAME route (lihat router/routes/admin.routes.js). Mau tambah menu? Tambah satu baris di sini.
const groups = [
  { title: 'Ringkasan', items: [{ label: 'Dashboard', to: 'admin-dashboard' }] },
  {
    title: 'Laporan',
    items: [
      { label: 'Verifikasi laporan', to: 'admin-verifikasi-laporan' },
      { label: 'Kelola laporan', to: 'admin-kelola-laporan' },
      { label: 'Moderasi komentar', to: 'admin-moderasi-komentar' },
    ],
  },
  {
    title: 'Pengelolaan',
    items: [
      { label: 'Instansi & petugas', to: 'admin-data-instansi' },
      { label: 'Data master', to: 'admin-data-master' },
      { label: 'Pengaturan SLA', to: 'admin-pengaturan-sla' },
    ],
  },
  {
    title: 'Pengawasan',
    items: [
      { label: 'Log audit', to: 'admin-log-audit' },
      { label: 'Notifikasi', to: 'admin-notifikasi', badge: true },
    ],
  },
]
</script>

<template>
  <aside class="sidebar">
    <nav aria-label="Menu admin">
      <div v-for="group in groups" :key="group.title" class="sidebar__group">
        <p class="sidebar__title">{{ group.title }}</p>
        <ul class="sidebar__list">
          <li v-for="item in group.items" :key="item.to">
            <RouterLink :to="{ name: item.to }" class="sidebar__link" active-class="is-active">
              {{ item.label }}
              <span
                v-if="item.badge && notifikasi.unreadCount > 0"
                class="sidebar__badge"
                :aria-label="`${notifikasi.unreadCount} belum dibaca`"
              >{{ badgeText }}</span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar { padding: 1rem; }
.sidebar__group + .sidebar__group { margin-top: 1.25rem; }
.sidebar__title {
  margin: 0 0 0.375rem;
  padding: 0 0.625rem;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.sidebar__list { display: grid; gap: 0.125rem; margin: 0; padding: 0; list-style: none; }
.sidebar__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.625rem;
  border-radius: var(--radius);
  color: var(--color-text);
}
.sidebar__link:hover { background: var(--color-bg-soft); }
.sidebar__link:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 1px; }
.sidebar__link.is-active { background: var(--color-primary); color: #fff; font-weight: 600; }
.sidebar__badge {
  min-width: 1.25rem;
  padding: 0 0.375rem;
  border-radius: 999px;
  background: var(--color-danger, #b91c1c);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.25rem;
  text-align: center;
}

/* Layar sempit: menu jadi satu baris yang bisa digeser, judul grup disembunyikan. */
@media (max-width: 767px) {
  .sidebar { padding: 0.5rem 1rem; }
  .sidebar nav { display: flex; gap: 0.25rem; overflow-x: auto; }
  .sidebar__group { display: contents; }
  .sidebar__group + .sidebar__group { margin-top: 0; }
  .sidebar__title { display: none; }
  .sidebar__list { display: flex; gap: 0.25rem; }
  .sidebar__link { white-space: nowrap; }
}
</style>