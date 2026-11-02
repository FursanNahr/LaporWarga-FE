<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronDown, LogOut, MapPin, Menu, Search, User } from 'lucide-vue-next'
import { assetUrl } from '@/api'
import { useAuth } from '@/composables/useAuth'
import { useSafeLink } from '@/composables/useSafeLink'

/**
 * AppTopbar: bilah atas di dalam DashboardLayout (pengganti AppNavbar untuk warga, instansi, admin).
 * Isinya: tombol menu (mobile), pencarian, kota, dan menu akun.
 */
defineProps({
  menuOpen: { type: Boolean, default: false },
})
const emit = defineEmits(['toggle-menu'])

const router = useRouter()
const route = useRoute()
const link = useSafeLink()
const { user, role, logout } = useAuth()

// ---- Pencarian: sama seperti AppNavbar, dikirim ke halaman Cari Laporan lewat ?q= ----
const keyword = ref('')
function submitSearch() {
  const q = keyword.value.trim()
  router.push({ ...link('cari-laporan'), query: q ? { q } : {} })
}

// ---- Akun ----
const ROLE_LABEL = { warga: 'Warga', instansi: 'Petugas instansi', admin: 'Admin' }
const avatar = computed(() => assetUrl(user.value?.avatarUrl))
const initial = computed(() => user.value?.name?.trim()?.[0]?.toUpperCase() ?? '?')
// Rute profil mengikuti pola `<role>-profil`; kalau belum ada, tautannya disembunyikan.
const profileRoute = computed(() => {
  const name = `${role.value}-profil`
  return router.hasRoute(name) ? { name } : null
})

const accountOpen = ref(false)
const accountRoot = ref(null)

function onDocumentClick(event) {
  if (accountRoot.value && !accountRoot.value.contains(event.target)) accountOpen.value = false
}
function onKeydown(event) {
  if (event.key === 'Escape') accountOpen.value = false
}
onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  window.removeEventListener('keydown', onKeydown)
})
watch(() => route.fullPath, () => (accountOpen.value = false))
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-sand-dark/70 bg-cream/90 backdrop-blur">
    <div class="flex h-20 items-center gap-3 px-4 sm:px-6 lg:px-8">
      <button
        type="button"
        class="-ml-2 cursor-pointer rounded-lg p-2 hover:bg-sand lg:hidden"
        aria-controls="app-sidebar"
        :aria-expanded="menuOpen"
        aria-label="Buka menu"
        @click="emit('toggle-menu')"
      >
        <Menu class="size-6" aria-hidden="true" />
      </button>

      <form class="relative min-w-0 flex-1 sm:max-w-[560px]" role="search" @submit.prevent="submitSearch">
        <label for="topbar-search" class="sr-only">Cari laporan</label>
        <Search class="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-maroon" aria-hidden="true" />
        <input
          id="topbar-search"
          v-model="keyword"
          type="search"
          placeholder="Cari laporan, kata kunci, atau lokasi..."
          class="h-12 w-full rounded-full border border-sand-dark bg-white/70 pl-12 pr-4 text-sm text-maroon placeholder:text-maroon/50 focus:border-maroon focus:outline-none"
        />
      </form>

      <div class="ml-auto flex shrink-0 items-center gap-4">
        <!-- Cakupan layanan. Belum berupa dropdown karena BE baru melayani satu kota. -->
        <div class="hidden h-11 items-center gap-2 rounded-full border border-sand-dark bg-white/70 px-4 text-sm font-semibold md:inline-flex">
          <MapPin class="size-4" aria-hidden="true" /> Bandung
        </div>

        <span class="hidden h-8 w-px bg-maroon/30 md:block" aria-hidden="true"></span>

        <div ref="accountRoot" class="relative">
          <button
            type="button"
            class="flex cursor-pointer items-center gap-1.5 rounded-full p-0.5 hover:bg-sand"
            aria-haspopup="menu"
            :aria-expanded="accountOpen"
            aria-label="Menu akun"
            @click="accountOpen = !accountOpen"
          >
            <span class="grid size-11 place-items-center overflow-hidden rounded-full bg-maroon text-base font-bold text-lime">
              <img v-if="avatar" :src="avatar" alt="" class="size-full object-cover" />
              <template v-else>{{ initial }}</template>
            </span>
            <ChevronDown class="mr-1 size-4" aria-hidden="true" />
          </button>

          <div
            v-if="accountOpen"
            role="menu"
            class="absolute right-0 top-full z-10 mt-2 w-60 overflow-hidden rounded-2xl border border-sand-dark bg-white shadow-lg"
          >
            <div class="border-b border-sand px-4 py-3">
              <p class="truncate text-sm font-bold">{{ user?.name }}</p>
              <p class="text-xs text-maroon/70">{{ ROLE_LABEL[role] ?? role }}</p>
            </div>
            <RouterLink
              v-if="profileRoute"
              :to="profileRoute"
              role="menuitem"
              class="flex items-center gap-2.5 px-4 py-3 text-sm font-semibold hover:bg-sand"
            >
              <User class="size-4" aria-hidden="true" /> Profil
            </RouterLink>
            <button
              type="button"
              role="menuitem"
              class="flex w-full cursor-pointer items-center gap-2.5 px-4 py-3 text-sm font-semibold hover:bg-sand"
              @click="logout"
            >
              <LogOut class="size-4" aria-hidden="true" /> Keluar
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>