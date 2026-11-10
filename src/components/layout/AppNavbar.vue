<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, User, Menu, X } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'
import { useSafeLink } from '@/composables/useSafeLink'
import { ROLES } from '@/constants/roles'
import { useNotifikasiStore } from '@/stores/notifikasi.store'
import AppLogo from '@/components/layout/AppLogo.vue'

const link = useSafeLink()
const router = useRouter()
const route = useRoute()

// Menu publik sesuai desain. `name` = NAME route (router/routes/*.routes.js).
const menus = [
  { label: 'Beranda', name: 'beranda' },
  { label: 'Feed', name: 'feed' },
  { label: 'Statistik', name: 'statistik' },
  { label: 'Tentang', name: 'tentang' },
]

const { isLoggedIn, user, role, logout } = useAuth()

const wargaMenus = [
  { label: 'Buat Laporan', name: 'warga-buat-laporan' },
  { label: 'Laporan Saya', name: 'warga-laporan-saya' },
  { label: 'Dasbor', name: 'warga-feed' },
]
// `badge: true` = tampilkan jumlah notifikasi belum dibaca.
const instansiMenus = [
  { label: 'Daftar Laporan', name: 'instansi-daftar-laporan' },
  { label: 'Notifikasi', name: 'instansi-notifikasi', badge: true },
]
const adminMenus = [
  { label: 'Panel Admin', name: 'admin-dashboard' },
  { label: 'Notifikasi', name: 'admin-notifikasi', badge: true },
]

const visibleMenus = computed(() => {
  if (role.value === ROLES.WARGA) return [...menus, ...wargaMenus]
  if (role.value === ROLES.INSTANSI) return [...menus, ...instansiMenus]
  if (role.value === ROLES.ADMIN) return [...menus, ...adminMenus]
  return menus
})

// ---- Badge notifikasi (instansi dan admin) + polling: logika lama, tidak diubah ----
const notifikasi = useNotifikasiStore()
const badgeText = computed(() => (notifikasi.unreadCount > 99 ? '99+' : String(notifikasi.unreadCount)))

const POLL_INTERVAL_MS = 60000
let pollTimer = null
const stopPolling = () => {
  clearInterval(pollTimer)
  pollTimer = null
}

watch(
  () => [isLoggedIn.value, role.value, user.value?.id],
  () => {
    stopPolling()
    notifikasi.reset()
    if (isLoggedIn.value && [ROLES.INSTANSI, ROLES.ADMIN].includes(role.value)) {
      notifikasi.fetchUnreadCount()
      pollTimer = setInterval(() => {
        if (!document.hidden) notifikasi.fetchUnreadCount()
      }, POLL_INTERVAL_MS)
    }
  },
  { immediate: true },
)
onBeforeUnmount(stopPolling)

// ---- Pencarian: kirim ke halaman Cari Laporan lewat query ?q= ----
const keyword = ref('')
watch(
  () => route.query.q,
  (q) => { keyword.value = typeof q === 'string' ? q : '' },
  { immediate: true },
)
const submitSearch = () => {
  const q = keyword.value.trim()
  router.push({ ...link('cari-laporan'), query: q ? { q } : {} })
  isOpen.value = false
}

const isOpen = ref(false)
watch(() => route.fullPath, () => (isOpen.value = false))

const linkClass =
  'relative inline-flex items-center gap-1.5 py-2 text-sm font-semibold text-maroon transition-colors ' +
  'after:absolute after:inset-x-0 after:-bottom-0.5 after:h-[3px] after:rounded-full after:bg-transparent ' +
  'hover:after:bg-lime/70 [&.is-active]:after:bg-lime'
</script>

<template>
  <header class="sticky top-0 z-40 bg-cream/90 backdrop-blur">
    <nav class="mx-auto flex h-20 w-full max-w-[1120px] items-center gap-6 px-4" aria-label="Navigasi utama">
      <RouterLink :to="link('beranda')" class="shrink-0" aria-label="Ke beranda">
        <AppLogo />
      </RouterLink>

      <!-- Menu desktop -->
      <ul class="hidden flex-1 items-center justify-center gap-5 lg:flex xl:gap-8">
        <li v-for="menu in visibleMenus" :key="menu.label">
          <RouterLink :to="link(menu.name)" exact-active-class="is-active" :class="linkClass">
            {{ menu.label }}
            <span
              v-if="menu.badge && notifikasi.unreadCount > 0"
              class="rounded-full bg-maroon px-1.5 text-[11px] font-bold leading-5 text-lime"
              :aria-label="`${notifikasi.unreadCount} belum dibaca`"
            >{{ badgeText }}</span>
          </RouterLink>
        </li>
      </ul>

      <!-- Kanan: pencarian + akun -->
      <div class="ml-auto flex items-center gap-4 lg:ml-0">
        <form class="relative hidden xl:block" role="search" @submit.prevent="submitSearch">
          <label for="nav-search" class="sr-only">Cari laporan</label>
          <Search class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-maroon" aria-hidden="true" />
          <input
            id="nav-search"
            v-model="keyword"
            type="search"
            placeholder="Cari laporan..."
            class="h-11 w-56 rounded-full border border-sand-dark bg-white/70 pl-10 pr-4 text-sm text-maroon placeholder:text-maroon/50 focus:border-maroon focus:outline-none"
          />
        </form>
        <RouterLink :to="link('cari-laporan')" class="hidden rounded-full p-2 hover:bg-sand lg:block xl:hidden" aria-label="Cari laporan">
          <Search class="size-5" aria-hidden="true" />
        </RouterLink>

        <span class="hidden h-8 w-px bg-maroon/40 lg:block" aria-hidden="true"></span>

        <RouterLink
          v-if="!isLoggedIn"
          :to="link('masuk')"
          class="hidden h-11 items-center gap-2 rounded-xl bg-maroon px-5 text-sm font-bold text-white transition-colors hover:bg-maroon-dark lg:inline-flex"
        >
          <User class="size-4" aria-hidden="true" /> Masuk
        </RouterLink>
        <div v-else class="hidden items-center gap-3 lg:flex">
          <span class="max-w-32 truncate text-sm font-semibold">{{ user?.name }}</span>
          <button
            type="button"
            class="h-11 cursor-pointer rounded-xl border border-maroon px-4 text-sm font-bold text-maroon transition-colors hover:bg-maroon hover:text-white"
            @click="logout"
          >Keluar</button>
        </div>

        <button
          type="button"
          class="cursor-pointer rounded-lg p-2 hover:bg-sand lg:hidden"
          :aria-expanded="isOpen"
          aria-controls="navbar-menu"
          aria-label="Buka menu"
          @click="isOpen = !isOpen"
        >
          <X v-if="isOpen" class="size-6" aria-hidden="true" />
          <Menu v-else class="size-6" aria-hidden="true" />
        </button>
      </div>
    </nav>

    <!-- Menu mobile -->
    <div v-if="isOpen" id="navbar-menu" class="border-t border-sand-dark bg-cream px-4 pb-5 pt-3 lg:hidden">
      <form class="mb-3" role="search" @submit.prevent="submitSearch">
        <label for="nav-search-m" class="sr-only">Cari laporan</label>
        <input
          id="nav-search-m"
          v-model="keyword"
          type="search"
          placeholder="Cari laporan..."
          class="h-11 w-full rounded-full border border-sand-dark bg-white px-4 text-sm focus:border-maroon focus:outline-none"
        />
      </form>
      <ul class="flex flex-col">
        <li v-for="menu in visibleMenus" :key="menu.label">
          <RouterLink
            :to="link(menu.name)"
            exact-active-class="is-active"
            class="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-semibold hover:bg-sand [&.is-active]:bg-lime"
          >
            {{ menu.label }}
            <span v-if="menu.badge && notifikasi.unreadCount > 0" class="rounded-full bg-maroon px-1.5 text-[11px] font-bold leading-5 text-lime">{{ badgeText }}</span>
          </RouterLink>
        </li>
      </ul>
      <RouterLink
        v-if="!isLoggedIn"
        :to="link('masuk')"
        class="mt-3 flex h-11 items-center justify-center gap-2 rounded-xl bg-maroon text-sm font-bold text-white"
      ><User class="size-4" aria-hidden="true" /> Masuk</RouterLink>
      <div v-else class="mt-3 flex items-center justify-between gap-3 px-3">
        <span class="truncate text-sm font-semibold">{{ user?.name }}</span>
        <button type="button" class="h-10 cursor-pointer rounded-xl border border-maroon px-4 text-sm font-bold" @click="logout">Keluar</button>
      </div>
    </div>
  </header>
</template>
