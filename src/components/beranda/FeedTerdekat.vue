<script setup>
import { onMounted, ref } from 'vue'
import { ArrowRight } from 'lucide-vue-next'
import { laporanApi } from '@/api/laporan.api'
import { useSafeLink } from '@/composables/useSafeLink'
import BerandaFeedCard from '@/components/beranda/BerandaFeedCard.vue'

const link = useSafeLink()

const LIMIT = 3
// Satuan radius mengikuti BE (param `radius` di GET /reports). Cek & sesuaikan kalau perlu.
const RADIUS = 5000

const reports = ref([])
const loading = ref(true)
const nearby = ref(false)

// Response bisa berupa body penuh, axios response, atau array langsung tergantung interceptor.
const extractList = (res) => {
  const raw = res?.data ?? res
  return Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []
}

const getPosition = () =>
  new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null), // izin ditolak / gagal -> feed terbaru
      { timeout: 6000, maximumAge: 300000 },
    )
  })

onMounted(async () => {
  try {
    const pos = await getPosition()
    if (pos) {
      const res = await laporanApi.list({ limit: LIMIT, lat: pos.lat, lng: pos.lng, radius: RADIUS })
      reports.value = extractList(res)
      nearby.value = reports.value.length > 0
    }
    if (!reports.value.length) {
      reports.value = extractList(await laporanApi.list({ limit: LIMIT }))
    }
  } catch {
    reports.value = []
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section aria-labelledby="feed-heading">
    <div class="mb-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <span class="size-3.5 rounded-full bg-lime" aria-hidden="true"></span>
        <h2 id="feed-heading" class="text-xl font-extrabold">{{ nearby ? 'Feed Laporan Terdekat' : 'Feed Laporan Terbaru' }}</h2>
      </div>
      <RouterLink :to="link('feed')" class="inline-flex shrink-0 items-center gap-1 text-xs font-bold hover:underline">
        Lihat Semua Feed <ArrowRight class="size-3.5" aria-hidden="true" />
      </RouterLink>
    </div>

    <div v-if="loading" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
      <div v-for="n in LIMIT" :key="n" class="h-80 animate-pulse rounded-2xl bg-sand"></div>
    </div>
    <div v-else-if="reports.length" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <BerandaFeedCard v-for="r in reports" :key="r.id" :report="r" />
    </div>
    <p v-else class="rounded-2xl bg-sand px-5 py-10 text-center text-sm">Belum ada laporan yang bisa ditampilkan.</p>
  </section>
</template>
