<script setup>
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Bell,
  Building2,
  ClipboardCheck,
  Database,
  FileText,
  House,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquare,
  Plus,
  ScrollText,
  Timer,
  User,
} from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'
import { useSafeLink } from '@/composables/useSafeLink'
import { ROLES } from '@/constants/roles'
import { useNotifikasiStore } from '@/stores/notifikasi.store'
import AppLogo from '@/components/layout/AppLogo.vue'

/**
 * AppSidebar: menu samping untuk WARGA, INSTANSI, dan ADMIN. Dipasang oleh DashboardLayout.
 *
 * - Layar >= lg: menempel di kiri. Layar lebih kecil: jadi drawer; `open` mengatur buka/tutup.
 * - Mau tambah menu? Tambah satu baris di MENUS. `to` = NAME route. Kalau route-nya belum
 *   terdaftar, menu tampil nonaktif ("Segera") dan otomatis aktif begitu route-nya dibuat.
 */
const props = defineProps({
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])

const router = useRouter()
const link = useSafeLink()
const { isLoggedIn, user, role, logout } = useAuth()

const MENUS = {
  [ROLES.WARGA]: [
    {
      items: [
        { label: 'Feed', to: 'warga-feed', icon: House },
        { label: 'Buat Laporan', to: 'warga-buat-laporan', icon: Plus },
        { label: 'Laporan Saya', to: 'warga-laporan-saya', icon: FileText },
        { label: 'Notifikasi', to: 'warga-notifikasi', icon: Bell, badge: true },
        { label: 'Profil', to: 'warga-profil', icon: User },
      ],
    },
  ],
  // Kelola Progress tidak ditaruh di sini karena biasanya dibuka dari satu laporan (butuh :id).
  [ROLES.INSTANSI]: [
    {
      items: [
        { label: 'Daftar Laporan', to: 'instansi-daftar-laporan', icon: FileText },
        { label: 'Notifikasi', to: 'instansi-notifikasi', icon: Bell, badge: true },
        { label: 'Profil', to: 'instansi-profil', icon: User },
      ],
    },
  ],
  [ROLES.ADMIN]: [
    { title: 'Ringkasan', items: [{ label: 'Dashboard', to: 'admin-dashboard', icon: LayoutDashboard }] },
    {
      title: 'Laporan',
      items: [
        { label: 'Verifikasi laporan', to: 'admin-verifikasi-laporan', icon: ClipboardCheck },
        { label: 'Kelola laporan', to: 'admin-kelola-laporan', icon: FileText },
        { label: 'Moderasi komentar', to: 'admin-moderasi-komentar', icon: MessageSquare },
      ],
    },
    {
      title: 'Pengelolaan',
      items: [
        { label: 'Instansi & petugas', to: 'admin-data-instansi', icon: Building2 },
        { label: 'Data master', to: 'admin-data-master', icon: Database },
        { label: 'Pengaturan SLA', to: 'admin-pengaturan-sla', icon: Timer },
      ],
    },
    {
      title: 'Pengawasan',
      items: [
        { label: 'Log audit', to: 'admin-log-audit', icon: ScrollText },
        { label: 'Notifikasi', to: 'admin-notifikasi', icon: Bell, badge: true },
      ],
    },
  ],
}

const groups = computed(() => MENUS[role.value] ?? [])
const hasRoute = (name) => router.hasRoute(name)

// ---- Badge notifikasi + polling (dipindah dari AppNavbar, karena navbar tidak tampil di dashboard) ----
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
    if (!isLoggedIn.value) return
    notifikasi.fetchUnreadCount()
    pollTimer = setInterval(() => {
      if (!document.hidden) notifikasi.fetchUnreadCount()
    }, POLL_INTERVAL_MS)
  },
  { immediate: true },
)

// ---- Esc menutup drawer ----
const onKeydown = (event) => {
  if (event.key === 'Escape' && props.open) emit('close')
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  stopPolling()
})

const itemBase = 'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-semibold text-maroon'
const linkClass =
  itemBase +
  ' transition-colors hover:bg-sand [&.is-active]:bg-lime [&.is-active]:font-bold [&.is-active]:hover:bg-lime'
const disabledClass = itemBase + ' cursor-not-allowed opacity-45'
</script>

<template>
  <!-- Tirai gelap di belakang drawer (hanya layar < lg) -->
  <div
    v-if="open"
    class="fixed inset-0 z-40 bg-maroon/40 lg:hidden"
    aria-hidden="true"
    @click="emit('close')"
  ></div>

  <aside
    id="app-sidebar"
    class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sand-dark bg-white transition-[translate,visibility] duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:w-60 lg:shrink-0"
    :class="{ 'max-lg:invisible max-lg:-translate-x-full': !open }"
  >
    <div class="flex h-20 shrink-0 items-center px-6">
      <RouterLink :to="link('beranda')" aria-label="Ke beranda">
        <AppLogo />
      </RouterLink>
    </div>

    <nav class="flex-1 overflow-y-auto px-4 py-2" :aria-label="`Menu ${role}`">
      <div v-for="(group, index) in groups" :key="group.title ?? index" :class="{ 'mt-5': index > 0 }">
        <p v-if="group.title" class="mb-1.5 px-3.5 text-xs font-semibold tracking-wide text-maroon/60">
          {{ group.title }}
        </p>
        <ul class="grid gap-1">
          <li v-for="item in group.items" :key="item.to">
            <RouterLink
              v-if="hasRoute(item.to)"
              :to="{ name: item.to }"
              active-class="is-active"
              :class="linkClass"
            >
              <component :is="item.icon" class="size-5 shrink-0" aria-hidden="true" />
              <span class="flex-1">{{ item.label }}</span>
              <span
                v-if="item.badge && notifikasi.unreadCount > 0"
                class="grid h-5 min-w-5 place-items-center rounded-full bg-maroon px-1.5 text-[11px] font-bold text-white"
                :aria-label="`${notifikasi.unreadCount} belum dibaca`"
              >{{ badgeText }}</span>
            </RouterLink>

            <span v-else :class="disabledClass" aria-disabled="true" title="Halaman ini belum tersedia">
              <component :is="item.icon" class="size-5 shrink-0" aria-hidden="true" />
              <span class="flex-1">{{ item.label }}</span>
              <span class="rounded-full bg-sand px-2 py-0.5 text-[10px] font-bold">Segera</span>
            </span>
          </li>
        </ul>
      </div>
    </nav>

    <div class="shrink-0 space-y-4 p-4">
      <!-- Kartu ajakan: hanya untuk warga, disembunyikan di layar yang pendek -->
      <div
        v-if="role === ROLES.WARGA"
        class="hidden rounded-3xl bg-lime/25 p-5 [@media(min-height:720px)]:block"
      >
        <Megaphone class="size-12 -rotate-12 text-maroon" stroke-width="1.6" aria-hidden="true" />
        <p class="mt-3 text-lg font-extrabold leading-tight">Bersama, untuk Bandung lebih baik!</p>
      </div>

      <button
        type="button"
        class="flex h-12 w-full cursor-pointer items-center gap-3 rounded-xl border border-sand-dark bg-white px-4 text-sm font-bold text-maroon transition-colors hover:bg-sand"
        @click="logout"
      >
        <LogOut class="size-5" aria-hidden="true" /> Keluar
      </button>
    </div>
  </aside>
</template>