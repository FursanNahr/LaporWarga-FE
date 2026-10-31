<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { ROLES } from '@/constants/roles'
import { useNotifikasiStore } from '@/stores/notifikasi.store'
import BaseButton from '@/components/common/BaseButton.vue'

// Daftar menu dipisah dari template. Mau tambah menu? Cukup tambah satu baris di sini.
// `to` memakai NAME route (lihat router/routes/publik.routes.js), bukan path.
const menus = [
  { label: 'Beranda', to: { name: 'beranda' } },
  { label: 'Cari Laporan', to: { name: 'cari-laporan' } },
  { label: 'Papan Transparansi', to: { name: 'papan-transparansi' } },
]

const { isLoggedIn, user, role, logout } = useAuth()

// Menu tambahan khusus role warga (nama route dari router/routes/warga.routes.js)
const wargaMenus = [
  { label: 'Buat Laporan', to: { name: 'warga-buat-laporan' } },
  { label: 'Laporan Saya', to: { name: 'warga-laporan-saya' } },
]

// Menu tambahan khusus role instansi (nama route dari router/routes/instansi.routes.js).
// `badge: true` = tampilkan jumlah notifikasi belum dibaca.
const instansiMenus = [
  { label: 'Daftar Laporan', to: { name: 'instansi-daftar-laporan' } },
  { label: 'Notifikasi', to: { name: 'instansi-notifikasi' }, badge: true },
]

// Admin: menu lengkapnya ada di sidebar (AppSidebar.vue), di navbar cukup pintasan.
const adminMenus = [
  { label: 'Panel Admin', to: { name: 'admin-dashboard' } },
  { label: 'Notifikasi', to: { name: 'admin-notifikasi' }, badge: true },
]

const visibleMenus = computed(() => {
  if (role.value === ROLES.WARGA) return [...menus, ...wargaMenus]
  if (role.value === ROLES.INSTANSI) return [...menus, ...instansiMenus]
  if (role.value === ROLES.ADMIN) return [...menus, ...adminMenus]
  return menus
})

// ---- Badge notifikasi (instansi dan admin) ---------------------------------
const notifikasi = useNotifikasiStore()
const badgeText = computed(() => (notifikasi.unreadCount > 99 ? '99+' : String(notifikasi.unreadCount)))

const POLL_INTERVAL_MS = 60000
let pollTimer = null

const stopPolling = () => {
  clearInterval(pollTimer)
  pollTimer = null
}

// Mulai (atau hentikan) polling setiap kali status login, role, atau akun berganti.
// Navbar ini juga yang memberi angka untuk badge di sidebar admin.
watch(
  () => [isLoggedIn.value, role.value, user.value?.id],
  () => {
    stopPolling()
    notifikasi.reset()
    if (isLoggedIn.value && [ROLES.INSTANSI, ROLES.ADMIN].includes(role.value)) {
      notifikasi.fetchUnreadCount()
      pollTimer = setInterval(() => {
        if (!document.hidden) notifikasi.fetchUnreadCount() // tab di latar belakang: lewati
      }, POLL_INTERVAL_MS)
    }
  },
  { immediate: true },
)
onBeforeUnmount(stopPolling)

const isOpen = ref(false) // state menu untuk tampilan mobile
const route = useRoute()

// Tutup menu mobile otomatis setiap pindah halaman
watch(() => route.fullPath, () => (isOpen.value = false))
</script>

<template>
  <header class="navbar">
    <nav class="container navbar__inner" aria-label="Navigasi utama">
      <RouterLink :to="{ name: 'beranda' }" class="navbar__brand">LaporWarga</RouterLink>

      <button
        class="navbar__toggle"
        type="button"
        :aria-expanded="isOpen"
        aria-controls="navbar-menu"
        aria-label="Buka menu"
        @click="isOpen = !isOpen"
      >
        <span></span><span></span><span></span>
      </button>

      <ul id="navbar-menu" class="navbar__menu" :class="{ 'is-open': isOpen }">
        <li v-for="menu in visibleMenus" :key="menu.label">
          <RouterLink :to="menu.to" class="navbar__link">
            {{ menu.label }}
            <span
              v-if="menu.badge && notifikasi.unreadCount > 0"
              class="navbar__badge"
              :aria-label="`${notifikasi.unreadCount} belum dibaca`"
            >{{ badgeText }}</span>
          </RouterLink>
        </li>

        <li v-if="!isLoggedIn">
          <RouterLink :to="{ name: 'masuk' }" class="btn btn-primary">Masuk</RouterLink>
        </li>
        <template v-else>
          <li class="navbar__user">{{ user?.name }}</li>
          <li><BaseButton variant="secondary" @click="logout">Keluar</BaseButton></li>
        </template>
      </ul>
    </nav>
  </header>
</template>

<style scoped>
.navbar__badge {
  display: inline-block;
  min-width: 1.25rem;
  margin-left: 0.375rem;
  padding: 0 0.375rem;
  border-radius: 999px;
  background: var(--color-danger, #b91c1c);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.25rem;
  text-align: center;
}

.navbar {
  position: sticky;
  top: 0;
  z-index: 40;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}
.navbar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--navbar-height);
}
.navbar__brand {
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--color-primary);
}
.navbar__menu {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.navbar__link {
  color: var(--color-text-muted);
  padding: 0.25rem 0;
  border-bottom: 2px solid transparent;
}
.navbar__link:hover { color: var(--color-text); }
.navbar__user { color: var(--color-text); font-weight: 500; }

/* Class ini otomatis dipasang vue-router pada link yang sedang aktif */
.navbar__link.router-link-exact-active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.navbar__toggle {
  display: none;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: none;
  border: 0;
  cursor: pointer;
}
.navbar__toggle span {
  width: 22px;
  height: 2px;
  background: var(--color-text);
}

/* Tampilan mobile */
@media (max-width: 768px) {
  .navbar__toggle { display: flex; }
  .navbar__menu {
    display: none;
    position: absolute;
    top: var(--navbar-height);
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
  }
  .navbar__menu.is-open { display: flex; }
}

.navbar__badge {
  display: inline-block;
  min-width: 1.25rem;
  margin-left: 0.375rem;
  padding: 0 0.375rem;
  border-radius: 999px;
  background: var(--color-danger, #b91c1c);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.25rem;
  text-align: center;
}
</style>