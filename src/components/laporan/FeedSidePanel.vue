<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Map as MapIcon, ThumbsUp, TrendingUp, Trophy } from 'lucide-vue-next'
import { MAP_PINS_DUMMY, MAP_USER_DUMMY, TRENDING_DUMMY } from '@/constants/feedDummy'

/**
 * FeedSidePanel: panel kanan halaman Feed (hanya tampil di layar >= xl).
 *
 * - Peta: menampilkan pin laporan nyata jika tersedia, atau fallback visual ilustrasi.
 * - Trending: menampilkan laporan dengan dukungan/upvote terbanyak dari data riil.
 */
const props = defineProps({
  trending: { type: Array, default: () => [] },
  reports: { type: Array, default: () => [] },
  userCoords: { type: Object, default: null },
  loadingTrending: { type: Boolean, default: false },
})

const router = useRouter()
const hasMapRoute = router.hasRoute('peta')

const activeTrending = computed(() => {
  if (props.trending && props.trending.length > 0) return props.trending
  return TRENDING_DUMMY
})

// Normalisasi koordinat laporan nyata ke dalam kanvas SVG (320 x 220)
const mapPins = computed(() => {
  const valid = (props.reports || []).filter(
    (r) => typeof r.latitude === 'number' && typeof r.longitude === 'number',
  )
  if (!valid.length) {
    return MAP_PINS_DUMMY.map((p) => ({ ...p, id: null, title: 'Laporan' }))
  }

  const lats = valid.map((r) => r.latitude)
  const lngs = valid.map((r) => r.longitude)
  let minLat = Math.min(...lats)
  let maxLat = Math.max(...lats)
  let minLng = Math.min(...lngs)
  let maxLng = Math.max(...lngs)

  if (maxLat - minLat < 0.005) {
    minLat -= 0.01
    maxLat += 0.01
  }
  if (maxLng - minLng < 0.005) {
    minLng -= 0.01
    maxLng += 0.01
  }

  const W = 320
  const H = 220
  const PAD_X = 26
  const PAD_Y = 32

  return valid.slice(0, 8).map((r) => {
    const x = PAD_X + ((r.longitude - minLng) / (maxLng - minLng)) * (W - PAD_X * 2)
    const y = H - (PAD_Y + ((r.latitude - minLat) / (maxLat - minLat)) * (H - PAD_Y * 2))
    const type = r.subcategory?.name ?? 'Laporan'
    const title = r.title || (r.address ? `${type} di ${r.address}` : r.description || type)
    return {
      id: r.id,
      x: Math.round(Math.max(PAD_X, Math.min(W - PAD_X, x))),
      y: Math.round(Math.max(PAD_Y, Math.min(H - PAD_Y, y))),
      title,
    }
  })
})

const userPin = computed(() => {
  if (!props.userCoords?.latitude || !props.userCoords?.longitude) return MAP_USER_DUMMY
  // Tampilkan di tengah kanvas jika ada lokasi user
  return { x: 160, y: 110 }
})

function scrollToFeed() {
  document.getElementById('feed-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function onPinClick(id) {
  if (id) {
    router.push({ name: 'detail-laporan', params: { id } })
  } else {
    scrollToFeed()
  }
}

const card = 'rounded-3xl bg-white p-4 shadow-[0_4px_16px_-6px_rgba(68,36,45,.2)]'
</script>

<template>
  <aside
    class="hidden flex-col gap-5 xl:sticky xl:top-24 xl:flex xl:max-h-[calc(100dvh-7rem)] xl:self-start xl:overflow-y-auto xl:pb-2"
    aria-label="Panel samping feed"
  >
    <section :class="card" aria-labelledby="peta-terdekat">
      <h2 id="peta-terdekat" class="flex items-center gap-2 text-[15px] font-extrabold">
        <span class="size-3 rounded-full bg-lime" aria-hidden="true"></span> Peta Laporan Terdekat
      </h2>

      <div class="relative mt-3 overflow-hidden rounded-2xl">
        <svg viewBox="0 0 320 220" class="block h-auto w-full" role="img" aria-label="Ilustrasi peta laporan di sekitar kamu">
          <rect width="320" height="220" fill="#eaf0e2" />
          <rect x="0" y="150" width="120" height="70" rx="8" fill="#d6e5c8" />
          <rect x="215" y="0" width="105" height="58" rx="8" fill="#d6e5c8" />
          <g stroke="#ffffff" stroke-linecap="round" fill="none">
            <path d="M-10 60 L330 100" stroke-width="14" />
            <path d="M110 -10 L150 230" stroke-width="12" />
            <path d="M-10 172 L330 150" stroke-width="9" />
            <path d="M240 -10 L272 230" stroke-width="8" />
          </g>
          <g
            v-for="(pin, index) in mapPins"
            :key="pin.id ?? index"
            :transform="`translate(${pin.x - 12} ${pin.y - 32})`"
            class="group cursor-pointer transition-transform hover:scale-125"
            @click="onPinClick(pin.id)"
          >
            <title>{{ pin.title }} (Klik untuk lihat detail)</title>
            <path d="M12 0a11 11 0 0 0-11 11c0 8 11 21 11 21s11-13 11-21A11 11 0 0 0 12 0z" class="fill-maroon transition-colors group-hover:fill-maroon-dark" />
            <circle cx="12" cy="11" r="4" class="fill-cream" />
          </g>
          <circle :cx="userPin.x" :cy="userPin.y" r="16" fill="#3b82f6" fill-opacity="0.2" />
          <circle :cx="userPin.x" :cy="userPin.y" r="8" fill="#3b82f6" stroke="#ffffff" stroke-width="3" />
        </svg>

        <RouterLink
          v-if="hasMapRoute"
          :to="{ name: 'peta' }"
          class="absolute inset-x-3 bottom-3 inline-flex h-11 items-center justify-center gap-2 rounded-full border border-maroon bg-white text-sm font-bold hover:bg-sand"
        >
          <MapIcon class="size-4" aria-hidden="true" /> Lihat Peta Lengkap <ArrowRight class="size-4" aria-hidden="true" />
        </RouterLink>
        <p v-else class="absolute inset-x-3 bottom-3 rounded-full bg-white/90 px-3 py-2 text-center text-xs font-semibold">
          {{ reports.length ? `${reports.length} laporan terpantau` : 'Peta interaktif segera hadir' }}
        </p>
      </div>
    </section>

    <section :class="card" aria-labelledby="trending-title">
      <div class="flex items-center justify-between gap-2">
        <h2 id="trending-title" class="flex items-center gap-2 text-[15px] font-extrabold">
          <TrendingUp class="size-5" aria-hidden="true" /> Trending di Bandung
        </h2>
        <RouterLink :to="{ name: 'cari-laporan' }" class="inline-flex shrink-0 items-center gap-1 text-xs font-semibold hover:underline">
          Lihat Semua <ArrowRight class="size-3.5" aria-hidden="true" />
        </RouterLink>
      </div>

      <div v-if="loadingTrending" class="mt-3 space-y-3" aria-busy="true">
        <div v-for="n in 3" :key="n" class="h-10 animate-pulse rounded-lg bg-sand"></div>
      </div>

      <ol v-else class="mt-2 divide-y divide-sand-dark/60">
        <li v-for="(item, index) in activeTrending" :key="item.id ?? index" class="flex items-center gap-3 py-3">
          <span class="grid size-7 shrink-0 place-items-center rounded-full border border-maroon text-sm font-bold">{{ index + 1 }}</span>

          <RouterLink
            v-if="item.id"
            :to="{ name: 'detail-laporan', params: { id: item.id } }"
            class="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-snug hover:underline"
          >{{ item.title }}</RouterLink>
          <p v-else class="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-snug">{{ item.title }}</p>

          <span class="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-maroon/80">
            <ThumbsUp class="size-4" aria-hidden="true" /> {{ item.upvotes }}
            <span class="sr-only">dukungan</span>
          </span>
        </li>
      </ol>
    </section>

    <section class="flex items-center gap-3 rounded-3xl bg-lime/40 p-4" aria-label="Ajakan memberi dukungan">
      <Trophy class="size-12 shrink-0 text-maroon" stroke-width="1.6" aria-hidden="true" />
      <div class="min-w-0 flex-1">
        <p class="text-sm font-extrabold leading-snug">Dukung laporan yang kamu anggap penting!</p>
        <p class="mt-0.5 text-xs">Beri upvote dan verifikasi, yuk!</p>
      </div>
      <button
        type="button"
        class="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-maroon text-white transition-colors hover:bg-maroon-dark"
        aria-label="Ke daftar laporan"
        @click="scrollToFeed"
      >
        <ArrowRight class="size-5" aria-hidden="true" />
      </button>
    </section>
  </aside>
</template>
