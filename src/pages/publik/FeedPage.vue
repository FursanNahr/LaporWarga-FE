<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { laporanApi } from '@/api/laporan.api'
import { useAuth } from '@/composables/useAuth'
import { useGeolocation } from '@/composables/useGeolocation'
import { usePagination } from '@/composables/usePagination'
import { ROLES } from '@/constants/roles'
import FeedCard from '@/components/laporan/FeedCard.vue'

/**
 * FeedPage: feed laporan di sekitar pengguna (gaya Instagram), dengan infinite scroll.
 *
 * Halaman ini dipakai di DUA rute: `feed` (publik, PublicLayout, boleh tanpa login) dan
 * `warga-feed` (DashboardLayout dengan sidebar). Isinya sama; yang beda hanya pembungkusnya.
 *
 * Alur lokasi: minta lokasi perangkat. Berhasil -> laporan dalam radius sekitar (radius standar
 * dari BE). Ditolak/gagal -> laporan terbaru secara umum, dengan tombol untuk mencoba lagi.
 */

// Kalau izin lokasi tidak dijawab, jangan biarkan layar kosong: tampilkan laporan terbaru dulu.
const LOCATION_WAIT_MS = 4000

const route = useRoute()
const router = useRouter()
const { isLoggedIn, role } = useAuth()
const { coords, loading: locating, error: geoError, locate } = useGeolocation()
const { items, loading, loadingMore, error, hasMore, load, loadMore } = usePagination(
  laporanApi.list,
  { limit: 10 },
)

const nearby = computed(() => coords.value !== null)
const feedParams = () =>
  coords.value ? { lat: coords.value.latitude, lng: coords.value.longitude } : {}

const modeText = computed(() => {
  if (locating.value) return 'Mencari lokasimu…'
  if (nearby.value) return 'Menampilkan laporan di sekitar lokasimu.'
  if (geoError.value) return `${geoError.value} Menampilkan laporan terbaru.`
  return 'Menampilkan laporan terbaru.'
})

// Tombol "Buat laporan": tamu diarahkan masuk dulu, lalu kembali ke formulir.
const canCreate = computed(() => !isLoggedIn.value || role.value === ROLES.WARGA)
const createLink = computed(() =>
  isLoggedIn.value
    ? { name: 'warga-buat-laporan' }
    : { name: 'masuk', query: { redirect: router.resolve({ name: 'warga-buat-laporan' }).fullPath } },
)

// Supaya "kosong" tidak sempat berkedip sebelum muat pertama selesai.
const loaded = ref(false)
watch(loading, (isLoading, wasLoading) => {
  if (wasLoading && !isLoading) loaded.value = true
})

const showSkeleton = computed(() => items.value.length === 0 && (loading.value || locating.value) && !error.value)
const showEmpty = computed(() => loaded.value && !loading.value && !error.value && items.value.length === 0)
const showEnd = computed(() => items.value.length > 0 && !hasMore.value && !loading.value && !error.value)

// ---- Lokasi ------------------------------------------------------------------

async function findLocation() {
  const position = await locate()
  if (position) load(feedParams())
}

function showLatest() {
  coords.value = null
  load({})
}

// ---- Infinite scroll -----------------------------------------------------------

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

// ---- Siklus hidup --------------------------------------------------------------

let fallbackTimer = null
let fallbackFired = false
let unmounted = false

onMounted(async () => {
  if ('IntersectionObserver' in window && sentinel.value) {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) maybeLoadMore()
      },
      { rootMargin: '400px 0px' },
    )
    observer.observe(sentinel.value)
  }

  fallbackTimer = setTimeout(() => {
    fallbackFired = true
    load({})
  }, LOCATION_WAIT_MS)

  const position = await locate()
  clearTimeout(fallbackTimer)
  if (unmounted) return

  // Lokasi didapat -> muat versi sekitar. Gagal -> muat terbaru, kecuali sudah termuat oleh timer di atas.
  if (position || !fallbackFired) load(feedParams())
})

onBeforeUnmount(() => {
  unmounted = true
  clearTimeout(fallbackTimer)
  observer?.disconnect()
})
</script>

<template>
  <section class="feed" aria-labelledby="feed-title">
    <header class="feed__header">
      <div>
        <h1 id="feed-title" class="feed__title">Feed laporan</h1>
        <p class="feed__subtitle">
          Masalah fasilitas publik yang dilaporkan warga. Dukung dan verifikasi supaya cepat ditangani.
        </p>
      </div>
      <RouterLink v-if="canCreate" :to="createLink" class="btn btn-primary">Buat laporan</RouterLink>
    </header>

    <p v-if="!isLoggedIn" class="feed__hint">
      <RouterLink :to="{ name: 'masuk', query: { redirect: route.fullPath } }">Masuk</RouterLink>
      untuk mendukung, memverifikasi, dan berkomentar.
    </p>

    <div class="feed__mode" role="status">
      <span>{{ modeText }}</span>
      <button v-if="!locating && nearby" type="button" class="feed__link" @click="showLatest">
        Lihat laporan terbaru
      </button>
      <button v-else-if="!locating" type="button" class="feed__link" @click="findLocation">
        {{ geoError ? 'Coba lagi' : 'Gunakan lokasiku' }}
      </button>
    </div>

    <!-- Muat pertama -->
    <div v-if="showSkeleton" class="feed__list" aria-busy="true" aria-label="Memuat laporan">
      <div v-for="n in 3" :key="n" class="feed__skeleton">
        <div class="feed__skeleton-line feed__skeleton-line--short"></div>
        <div class="feed__skeleton-media"></div>
        <div class="feed__skeleton-line"></div>
        <div class="feed__skeleton-line feed__skeleton-line--short"></div>
      </div>
    </div>

    <!-- Gagal muat pertama -->
    <div v-else-if="error && items.length === 0" class="feed__state" role="alert">
      <p>{{ error }}</p>
      <button type="button" class="btn" @click="load()">Coba lagi</button>
    </div>

    <!-- Tidak ada laporan -->
    <div v-else-if="showEmpty" class="feed__state">
      <p v-if="nearby">Belum ada laporan di sekitarmu.</p>
      <p v-else>Belum ada laporan.</p>
      <button v-if="nearby" type="button" class="btn" @click="showLatest">Lihat laporan terbaru</button>
    </div>

    <!-- Daftar -->
    <div v-else class="feed__list" :class="{ 'is-refreshing': loading }">
      <FeedCard v-for="report in items" :key="report.id" :report="report" />
    </div>

    <!-- Penanda ujung daftar untuk infinite scroll (selalu ada di DOM) -->
    <div ref="sentinel" class="feed__sentinel" aria-hidden="true"></div>

    <p v-if="loadingMore" class="feed__footer" role="status">Memuat laporan lainnya…</p>
    <div v-else-if="error && items.length > 0" class="feed__footer" role="alert">
      <p>{{ error }}</p>
      <button type="button" class="btn" @click="loadMore">Coba lagi</button>
    </div>
    <p v-else-if="showEnd" class="feed__footer">Kamu sudah melihat semua laporan.</p>
  </section>
</template>

<style scoped>
/* Warna memakai variabel dengan nilai cadangan; sesuaikan namanya dengan variables.css-mu. */
.feed {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feed__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.feed__title {
  margin: 0;
  font-size: 1.35rem;
}
.feed__subtitle {
  margin: 4px 0 0;
  font-size: 0.9rem;
  color: var(--color-text-muted, #6b7280);
}

.feed__hint {
  margin: 0;
  font-size: 0.88rem;
  color: var(--color-text-muted, #6b7280);
}

.feed__mode {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 0.85rem;
  background: var(--color-bg-muted, #f3f4f6);
}
.feed__link {
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-weight: 600;
  color: var(--color-primary, #2563eb);
  cursor: pointer;
}

.feed__list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: opacity 0.15s;
}
.feed__list.is-refreshing {
  opacity: 0.5;
}

.feed__state,
.feed__footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin: 0;
  padding: 24px 0;
  text-align: center;
  color: var(--color-text-muted, #6b7280);
}
.feed__state p,
.feed__footer p {
  margin: 0;
}
.feed__footer {
  padding: 8px 0 24px;
  font-size: 0.85rem;
}

.feed__sentinel {
  height: 1px;
}

/* Kerangka saat memuat */
.feed__skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 12px;
}
.feed__skeleton-line,
.feed__skeleton-media {
  border-radius: 6px;
  background: linear-gradient(90deg, #eceff1 25%, #f6f7f8 37%, #eceff1 63%);
  background-size: 400% 100%;
  animation: feed-shimmer 1.4s ease infinite;
}
.feed__skeleton-line {
  height: 12px;
}
.feed__skeleton-line--short {
  width: 45%;
}
.feed__skeleton-media {
  aspect-ratio: 4 / 3;
}
@keyframes feed-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}
@media (prefers-reduced-motion: reduce) {
  .feed__skeleton-line,
  .feed__skeleton-media {
    animation: none;
  }
}
</style>
