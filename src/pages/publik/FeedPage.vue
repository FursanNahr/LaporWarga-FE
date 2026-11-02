<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Map as MapIcon, Plus } from 'lucide-vue-next'
import api from '@/api'
import { laporanApi } from '@/api/laporan.api'
import { useAuth } from '@/composables/useAuth'
import { useGeolocation } from '@/composables/useGeolocation'
import { usePagination } from '@/composables/usePagination'
import FeedCard from '@/components/laporan/FeedCard.vue'
import FeedFilterBar from '@/components/laporan/FeedFilterBar.vue'
import FeedSidePanel from '@/components/laporan/FeedSidePanel.vue'

/**
 * FeedPage: feed laporan (grid kartu) dengan filter dan infinite scroll.
 *
 * Dipakai di DUA rute: `feed` (PublicLayout, boleh tanpa login) dan `warga-feed` (DashboardLayout).
 * Isinya sama; yang beda hanya pembungkusnya (navbar untuk tamu, sidebar untuk yang sudah masuk).
 *
 * Alur lokasi: minta lokasi perangkat. Berhasil -> "Dekat Saya" (laporan dalam radius sekitar).
 * Ditolak/gagal/terlalu lama -> "Semua Lokasi" (laporan terbaru), dengan tombol untuk mencoba lagi.
 */

// Kalau izin lokasi tidak dijawab, jangan biarkan layar kosong: tampilkan laporan terbaru dulu.
const LOCATION_WAIT_MS = 4000

const router = useRouter()
const { isLoggedIn } = useAuth()
const { coords, loading: locating, error: geoError, locate } = useGeolocation()
const { items, loading, loadingMore, error, hasMore, load, loadMore } = usePagination(laporanApi.list, { limit: 12 })

// ---- Filter ------------------------------------------------------------------

const location = ref('all') // 'all' | 'nearby' | `district:<id>`
const baseLocation = ref('all') // nilai awal setelah lokasi dicoba; dipakai "Atur ulang"
const filters = reactive({ agencyId: '', status: '', sort: 'latest' })

const dirty = computed(
  () => location.value !== baseLocation.value || Boolean(filters.agencyId) || Boolean(filters.status) || filters.sort !== 'latest',
)

// Parameter GET /reports. `sort` tidak dikirim: BE belum punya parameter itu (lihat displayItems).
const params = computed(() => {
  const result = {}
  if (location.value === 'nearby' && coords.value) {
    result.lat = coords.value.latitude
    result.lng = coords.value.longitude
  } else if (location.value.startsWith('district:')) {
    result.districtId = location.value.slice('district:'.length)
  }
  if (filters.agencyId) result.agencyId = filters.agencyId
  if (filters.status) result.status = filters.status
  return result
})
const paramsKey = computed(() => JSON.stringify(params.value))

// "Terpopuler" baru mengurutkan laporan yang SUDAH termuat. Urutan sebenarnya butuh `sort` di BE.
const displayItems = computed(() =>
  filters.sort === 'popular'
    ? [...items.value].sort((a, b) => (b.stats?.upvotes ?? 0) - (a.stats?.upvotes ?? 0))
    : items.value,
)

// Muat ulang kalau filter berubah, tapi hanya setelah muat pertama dimulai (lihat onMounted).
const ready = ref(false)
watch(paramsKey, () => {
  if (ready.value) load(params.value)
})

async function setLocation(value) {
  if (value === 'nearby' && !coords.value) {
    const position = await locate()
    if (!position) return // pesan kesalahan tampil lewat modeText
  }
  location.value = value
}

function resetFilters() {
  location.value = baseLocation.value
  filters.agencyId = ''
  filters.status = ''
  filters.sort = 'latest'
}

const modeText = computed(() => {
  if (locating.value) return 'Mencari lokasimu…'
  if (location.value === 'nearby') return 'Menampilkan laporan di sekitar lokasimu.'
  if (geoError.value && location.value === 'all') return `${geoError.value} Menampilkan laporan terbaru.`
  return ''
})

// ---- Pilihan instansi & kecamatan -------------------------------------------------
// Dibaca langsung dari endpoint publik BE. Kalau useMasterOptions sudah menyediakannya, ganti fungsi ini.
// Gagal dimuat tidak masalah: filternya hanya menampilkan pilihan "Semua".

const agencies = ref([])
const districts = ref([])

const toOptions = (body) => {
  const data = body?.data
  const list = Array.isArray(data) ? data : (data?.items ?? [])
  return list.map(({ id, name }) => ({ id, name }))
}

async function loadOptions() {
  const [agencyResult, districtResult] = await Promise.allSettled([api.get('/agencies'), api.get('/districts')])
  if (agencyResult.status === 'fulfilled') agencies.value = toOptions(agencyResult.value.data)
  if (districtResult.status === 'fulfilled') districts.value = toOptions(districtResult.value.data)
}

// ---- Tombol "Buat laporan" (untuk tamu; warga sudah punya di sidebar) ---------------

const createLink = computed(() => ({
  name: 'masuk',
  query: { redirect: router.resolve({ name: 'warga-buat-laporan' }).fullPath },
}))
const hasMapRoute = router.hasRoute('peta')

// ---- Status tampilan -----------------------------------------------------------------

// Supaya "kosong" tidak sempat berkedip sebelum muat pertama selesai.
const loaded = ref(false)
watch(loading, (isLoading, wasLoading) => {
  if (wasLoading && !isLoading) loaded.value = true
})

const showSkeleton = computed(() => items.value.length === 0 && (!ready.value || loading.value) && !error.value)
const showFullError = computed(() => items.value.length === 0 && Boolean(error.value) && !loading.value)
const showMoreError = computed(() => items.value.length > 0 && Boolean(error.value))
const showEmpty = computed(() => loaded.value && !loading.value && !error.value && items.value.length === 0)
const showEnd = computed(() => items.value.length > 0 && !hasMore.value && !loading.value && !error.value)

// ---- Infinite scroll -------------------------------------------------------------------

const sentinel = ref(null)
let observer = null

function nearBottom() {
  const el = sentinel.value
  return el ? el.getBoundingClientRect().top < window.innerHeight + 400 : false
}

// Muat halaman berikutnya kalau ujung daftar sudah dekat. Setelah error tidak mengulang otomatis
// (supaya server tidak dibanjiri); pengguna menekan "Coba lagi".
function maybeLoadMore() {
  if (error.value || !hasMore.value || loading.value || loadingMore.value) return
  if (nearBottom()) loadMore()
}

// Halaman pertama bisa lebih pendek dari layar: setelah tiap muat, cek lagi apakah masih perlu.
watch([loading, loadingMore, () => items.value.length], () => nextTick(maybeLoadMore))

// ---- Siklus hidup -----------------------------------------------------------------------

let fallbackTimer = null
let unmounted = false

function startLoading() {
  ready.value = true
  load(params.value)
}

onMounted(async () => {
  loadOptions()

  if ('IntersectionObserver' in window && sentinel.value) {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) maybeLoadMore()
      },
      { rootMargin: '400px 0px' },
    )
    observer.observe(sentinel.value)
  }

  fallbackTimer = setTimeout(startLoading, LOCATION_WAIT_MS)

  const position = await locate()
  clearTimeout(fallbackTimer)
  if (unmounted) return

  if (position) {
    baseLocation.value = 'nearby'
    // Kalau pengguna sudah memilih lokasi lain selama menunggu, jangan ditimpa.
    if (location.value === 'all') location.value = 'nearby'
  }
  // Belum dimuat oleh timer di atas -> muat sekarang. Sudah dimuat -> watch(paramsKey) yang menyusul.
  if (!ready.value) startLoading()
})

onBeforeUnmount(() => {
  unmounted = true
  clearTimeout(fallbackTimer)
  observer?.disconnect()
})
</script>

<template>
  <div class="mx-auto w-full max-w-[1360px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <div class="xl:grid xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-8">
      <section class="min-w-0" aria-labelledby="feed-title">
        <header class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 id="feed-title" class="text-4xl font-extrabold tracking-tight sm:text-[2.75rem] sm:leading-tight">
              Feed Laporan
            </h1>
            <p class="relative mt-1 inline-block pb-2 text-[15px]">
              Jelajahi laporan terbaru di sekitar kamu, dan dukung laporan yang menurutmu penting!
              <svg class="absolute -bottom-0.5 left-0 h-2 w-52 text-lime" viewBox="0 0 208 8" fill="none" aria-hidden="true">
                <path d="M2 5Q15 0 28 5T54 5T80 5T106 5T132 5T158 5T184 5T206 5" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
              </svg>
            </p>
          </div>

          <div class="flex items-center gap-3">
            <RouterLink
              v-if="hasMapRoute"
              :to="{ name: 'peta' }"
              class="inline-flex h-11 items-center gap-2 rounded-full border border-maroon px-5 text-sm font-bold hover:bg-sand"
            >
              <MapIcon class="size-4" aria-hidden="true" /> Lihat Peta
            </RouterLink>
            <RouterLink
              v-if="!isLoggedIn"
              :to="createLink"
              class="inline-flex h-11 items-center gap-2 rounded-full bg-maroon px-5 text-sm font-bold text-white transition-colors hover:bg-maroon-dark"
            >
              <Plus class="size-4" aria-hidden="true" /> Buat Laporan
            </RouterLink>
          </div>
        </header>

        <FeedFilterBar
          class="mt-6"
          :location="location"
          v-model:agency-id="filters.agencyId"
          v-model:status="filters.status"
          v-model:sort="filters.sort"
          :agencies="agencies"
          :districts="districts"
          :locating="locating"
          :dirty="dirty"
          @update:location="setLocation"
          @reset="resetFilters"
        />

        <p v-if="modeText" class="mt-3 text-sm text-maroon/80" role="status">
          {{ modeText }}
          <button
            v-if="geoError && location === 'all' && !locating"
            type="button"
            class="cursor-pointer font-bold underline underline-offset-2"
            @click="setLocation('nearby')"
          >Coba lagi</button>
        </p>

        <div id="feed-list" class="mt-5 scroll-mt-28" :aria-busy="loading">
          <div
            v-if="showSkeleton"
            class="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5"
            aria-hidden="true"
          >
            <div v-for="n in 6" :key="n" class="animate-pulse overflow-hidden rounded-2xl bg-white shadow-[0_4px_16px_-6px_rgba(68,36,45,.2)]">
              <div class="aspect-[16/10] bg-sand"></div>
              <div class="space-y-3 p-4">
                <div class="h-5 w-28 rounded-full bg-sand"></div>
                <div class="h-4 w-full rounded bg-sand"></div>
                <div class="h-4 w-2/3 rounded bg-sand"></div>
                <div class="h-8 w-1/2 rounded bg-sand"></div>
              </div>
            </div>
          </div>

          <div v-else-if="showFullError" class="rounded-2xl bg-white px-6 py-12 text-center" role="alert">
            <p class="text-lg font-extrabold">Laporan belum bisa dimuat</p>
            <p class="mt-1 text-sm text-maroon/80">Periksa koneksi internetmu, lalu coba lagi.</p>
            <button
              type="button"
              class="mt-4 h-11 cursor-pointer rounded-full bg-maroon px-6 text-sm font-bold text-white hover:bg-maroon-dark"
              @click="load(params)"
            >Coba lagi</button>
          </div>

          <div v-else-if="showEmpty" class="rounded-2xl bg-white px-6 py-12 text-center">
            <p class="text-lg font-extrabold">
              {{ dirty ? 'Tidak ada laporan yang cocok' : 'Belum ada laporan di sini' }}
            </p>
            <p class="mt-1 text-sm text-maroon/80">
              {{ dirty ? 'Coba ubah atau hapus filter.' : 'Jadilah yang pertama melaporkan masalah di sekitarmu.' }}
            </p>
            <button
              v-if="dirty"
              type="button"
              class="mt-4 h-11 cursor-pointer rounded-full border border-maroon px-6 text-sm font-bold hover:bg-sand"
              @click="resetFilters"
            >Atur ulang filter</button>
          </div>

          <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-5">
            <FeedCard v-for="report in displayItems" :key="report.id" :report="report" />
          </div>
        </div>

        <div ref="sentinel" class="h-px" aria-hidden="true"></div>

        <p v-if="loadingMore" class="py-6 text-center text-sm font-semibold text-maroon/70" role="status">
          Memuat laporan lainnya…
        </p>
        <p v-if="showMoreError" class="py-6 text-center text-sm" role="alert">
          Laporan lanjutan gagal dimuat.
          <button type="button" class="cursor-pointer font-bold underline underline-offset-2" @click="loadMore()">Coba lagi</button>
        </p>
        <p v-if="showEnd" class="py-6 text-center text-sm text-maroon/70">Kamu sudah melihat semua laporan.</p>
      </section>

      <FeedSidePanel />
    </div>
  </div>
</template>