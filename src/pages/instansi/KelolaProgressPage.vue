<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Camera,
  Clock,
  ExternalLink,
  Landmark,
  MapPin,
  MessageSquareText,
  RotateCcw,
  Share2,
  User,
} from 'lucide-vue-next'
import { assetUrl } from '@/api'
import { laporanApi } from '@/api/laporan.api'
import { actionsForStatus, REPORT_STATUS } from '@/constants/status'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth.store'
import { formatDateTime } from '@/utils/formatDate'
import { formatReporter } from '@/utils/formatStatus'
import BaseLoading from '@/components/common/BaseLoading.vue'
import PhotoGallery from '@/components/laporan/PhotoGallery.vue'
import ProgressTimeline from '@/components/laporan/ProgressTimeline.vue'
import ProgressUpdateForm from '@/components/laporan/ProgressUpdateForm.vue'
import ReportMiniMap from '@/components/laporan/ReportMiniMap.vue'
import StatusPill from '@/components/laporan/StatusPill.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

// Nama rute halaman publik DetailLaporanPage. Sesuaikan dengan router/routes/publik.routes.js.
const PUBLIC_DETAIL_ROUTE = 'detail-laporan'
// Role petugas di timeline (cermin constants/roles.js).
const AGENCY_ROLE = 'INSTANSI'

const report = ref(null)
const loading = ref(true)
const error = ref('')
const gallery = ref(null)

let requestId = 0 // respons milik request lama dibuang
async function fetchReport({ silent = false } = {}) {
  const id = ++requestId
  if (!silent) loading.value = true
  error.value = ''

  try {
    const { data: body } = await laporanApi.detail(route.params.id)
    if (id !== requestId) return
    report.value = body.data
  } catch (e) {
    if (id !== requestId) return
    if (!silent) report.value = null
    error.value =
      e.normalized?.status === 404
        ? 'Laporan tidak ditemukan.'
        : (e.normalized?.message ?? 'Gagal memuat laporan.')
  } finally {
    if (id === requestId && !silent) loading.value = false
  }
}

// Saat pindah ke halaman lain, params.id sempat kosong; jangan ikut memuat.
watch(
  () => route.params.id,
  (id) => {
    if (!id) return
    fetchReport()
  },
  { immediate: true },
)

// Instansi lain hanya boleh melihat. Dicek jika data akun membawa id instansi (BE tetap menolak dengan 404).
const myAgencyId = computed(() => auth.user?.agencyId ?? auth.user?.agency?.id ?? null)
const isOtherAgency = computed(
  () => myAgencyId.value !== null && report.value?.agency?.id !== myAgencyId.value,
)
const canUpdate = computed(
  () => Boolean(report.value) && !isOtherAgency.value && actionsForStatus(report.value.status).length > 0,
)
const isFinished = computed(() => report.value?.status === REPORT_STATUS.SELESAI)

// Data laporan tidak punya field judul: subkategori dipakai sebagai judul.
const title = computed(() => report.value?.subcategory?.name ?? report.value?.trackingCode ?? '')
const categoryName = computed(() => report.value?.subcategory?.category?.name ?? '')
const location = computed(() =>
  [report.value?.address, report.value?.district?.name].filter(Boolean).join(', '),
)
const hasCoords = computed(
  () =>
    report.value?.latitude != null &&
    report.value?.longitude != null &&
    Number.isFinite(Number(report.value.latitude)) &&
    Number.isFinite(Number(report.value.longitude)),
)
const mapUrl = computed(() =>
  hasCoords.value
    ? `https://www.google.com/maps?q=${Number(report.value.latitude)},${Number(report.value.longitude)}`
    : '',
)

const mainPhoto = computed(() => report.value?.photos?.[0] ?? null)
const timeline = computed(() => report.value?.timeline ?? [])
const latestEntry = computed(() => timeline.value.at(-1) ?? null)

// Catatan Instansi = catatan terbaru yang ditulis petugas instansi di timeline (tanpa field khusus di BE).
const agencyNote = computed(() => {
  const list = timeline.value
  for (let i = list.length - 1; i >= 0; i--) {
    const entry = list[i]
    if (entry.actor?.role === AGENCY_ROLE && entry.note?.trim()) return entry
  }
  return null
})

// Tautan yang dibagikan = halaman detail publik. Kalau nama rutenya belum cocok, pakai URL halaman ini.
function shareUrl() {
  try {
    const { href } = router.resolve({ name: PUBLIC_DETAIL_ROUTE, params: { id: report.value.id } })
    return new URL(href, window.location.origin).href
  } catch {
    return window.location.href
  }
}
async function shareReport() {
  try {
    await navigator.clipboard.writeText(shareUrl())
    toast.success('Tautan laporan disalin.')
  } catch {
    toast.error?.('Tautan tidak dapat disalin.')
  }
}

async function handleUpdated() {
  toast.success('Progres berhasil diperbarui.')
  await fetchReport({ silent: true })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <section class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
    <RouterLink
      :to="{ name: 'instansi-daftar-laporan' }"
      class="inline-flex items-center gap-2 text-sm font-bold hover:underline"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      Kembali ke Daftar Laporan
    </RouterLink>

    <div v-if="loading" class="mt-6">
      <BaseLoading text="Memuat laporan..." />
    </div>

    <p
      v-else-if="error && !report"
      class="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
      role="alert"
    >
      {{ error }}
    </p>

    <template v-else-if="report">
      <!-- Header -->
      <header class="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full bg-lime/35 px-3.5 py-1.5 text-sm font-extrabold">{{ report.trackingCode }}</span>
            <StatusPill :status="report.status" />
          </div>

          <h1 class="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">{{ title }}</h1>

          <ul class="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            <li v-if="location" class="flex items-center gap-2">
              <MapPin class="size-4 shrink-0" aria-hidden="true" />
              {{ location }}
            </li>
            <li v-if="report.agency" class="flex items-center gap-2">
              <Building2 class="size-4 shrink-0" aria-hidden="true" />
              {{ report.agency.name }}
            </li>
            <li class="flex items-center gap-2">
              <CalendarDays class="size-4 shrink-0" aria-hidden="true" />
              Dilaporkan pada {{ formatDateTime(report.createdAt) }}
            </li>
          </ul>
        </div>

        <button
          type="button"
          class="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full border border-sand-dark bg-white/70 px-6 text-sm font-bold transition-colors hover:border-maroon"
          @click="shareReport"
        >
          <Share2 class="size-4" aria-hidden="true" />
          Bagikan Laporan
        </button>
      </header>

      <p
        v-if="error"
        class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
        role="alert"
      >
        {{ error }}
      </p>

      <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:items-start">
        <!-- Kolom kiri -->
        <div class="min-w-0 space-y-5">
          <!-- Deskripsi -->
          <section class="overflow-hidden rounded-3xl border border-sand-dark bg-white/60">
            <div :class="mainPhoto ? 'sm:grid sm:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]' : ''">
              <button
                v-if="mainPhoto"
                type="button"
                class="relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden sm:aspect-auto sm:min-h-56"
                aria-label="Perbesar foto laporan"
                @click="gallery?.open(0)"
              >
                <img
                  :src="assetUrl(mainPhoto.url)"
                  :alt="`Foto laporan ${report.trackingCode}`"
                  class="absolute inset-0 size-full object-cover"
                />
              </button>

              <div class="min-w-0 p-5 sm:p-6">
                <h2 class="text-base font-extrabold">Deskripsi Laporan</h2>
                <p class="mt-2 whitespace-pre-line break-words text-[15px] leading-relaxed">{{ report.description }}</p>

                <dl class="mt-4 space-y-3 border-t border-sand-dark pt-4 text-sm">
                  <div v-if="categoryName" class="flex items-center gap-4">
                    <dt class="w-24 shrink-0 font-bold">Kategori</dt>
                    <dd><span class="rounded-full bg-sand px-3 py-1 text-xs font-bold">{{ categoryName }}</span></dd>
                  </div>
                  <div class="flex items-center gap-4">
                    <dt class="w-24 shrink-0 font-bold">Pelapor</dt>
                    <dd class="flex items-center gap-1.5">
                      <User class="size-4" aria-hidden="true" />
                      {{ formatReporter(report) }}
                    </dd>
                  </div>
                  <div v-if="report.reopenCount" class="flex items-center gap-4">
                    <dt class="w-24 shrink-0 font-bold">Dibuka kembali</dt>
                    <dd>
                      <span class="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                        <RotateCcw class="size-3.5" aria-hidden="true" />
                        {{ report.reopenCount }} kali
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          <!-- Lokasi -->
          <section v-if="hasCoords" class="rounded-3xl border border-sand-dark bg-white/60 p-5 sm:p-6">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="text-base font-extrabold">Lokasi</h2>
                <p class="mt-1 text-sm">{{ location || 'Alamat tidak dicantumkan.' }}</p>
              </div>
              <a
                :href="mapUrl"
                target="_blank"
                rel="noopener"
                class="inline-flex items-center gap-1.5 text-sm font-bold underline-offset-2 hover:underline"
              >
                Buka di peta
                <ExternalLink class="size-4" aria-hidden="true" />
              </a>
            </div>
            <ReportMiniMap :latitude="report.latitude" :longitude="report.longitude" class="mt-4 h-56" />
          </section>

          <!-- Foto bukti (foto laporan sebelum) -->
          <section v-if="report.photos?.length">
            <div class="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
              <Camera class="size-5" aria-hidden="true" />
              <h2 class="text-base font-extrabold">Foto Bukti</h2>
              <span class="text-xs text-maroon/60">Foto laporan (sebelum)</span>
            </div>
            <PhotoGallery ref="gallery" :photos="report.photos" :alt="`Foto laporan ${report.trackingCode}`" />
          </section>

          <!-- Instansi dan tindak lanjut terakhir -->
          <section
            v-if="report.agency"
            class="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-3xl border border-rose-100 bg-rose-50 p-5"
          >
            <div class="flex min-w-0 items-center gap-3">
              <Landmark class="size-9 shrink-0" stroke-width="1.5" aria-hidden="true" />
              <div class="min-w-0">
                <p class="text-xs">Instansi Penanganan</p>
                <p class="font-extrabold">{{ report.agency.name }}</p>
              </div>
            </div>

            <span class="hidden h-10 w-px bg-maroon/20 sm:block" aria-hidden="true"></span>

            <div v-if="latestEntry" class="flex items-center gap-3">
              <Clock class="size-7 shrink-0" stroke-width="1.5" aria-hidden="true" />
              <div>
                <p class="text-xs">Tindak Lanjut Terakhir</p>
                <p class="font-bold">{{ formatDateTime(latestEntry.createdAt) }}</p>
              </div>
            </div>

            <StatusPill :status="report.status" class="sm:ml-auto" />
          </section>

          <!-- Perbarui progres -->
          <section v-if="canUpdate" class="rounded-3xl border border-sand-dark bg-white/60 p-5 sm:p-6">
            <h2 class="text-base font-extrabold">Perbarui progres</h2>
            <div class="mt-4">
              <ProgressUpdateForm :report="report" @updated="handleUpdated" />
            </div>
          </section>
          <p v-else-if="isOtherAgency" class="rounded-2xl bg-sand px-4 py-3 text-sm">
            Laporan ini ditangani {{ report.agency?.name ?? 'instansi lain' }}. Anda hanya bisa melihatnya.
          </p>
          <p v-else-if="isFinished" class="rounded-2xl bg-sand px-4 py-3 text-sm">
            Laporan ini sudah selesai, tidak ada tindakan lanjutan.
          </p>
        </div>

        <!-- Kolom kanan -->
        <aside class="min-w-0">
          <section class="rounded-3xl border border-sand-dark bg-white/60 p-5 sm:p-6">
            <h2 class="text-lg font-extrabold">Progres Laporan</h2>
            <div class="mt-5">
              <ProgressTimeline :items="timeline" variant="card" />
            </div>

            <div v-if="agencyNote" class="mt-5 flex gap-3 rounded-2xl bg-rose-50 p-4">
              <MessageSquareText class="size-7 shrink-0" stroke-width="1.5" aria-hidden="true" />
              <div class="min-w-0">
                <h3 class="text-sm font-extrabold">Catatan Instansi</h3>
                <p class="mt-1 whitespace-pre-line break-words text-sm leading-relaxed">{{ agencyNote.note }}</p>
                <p class="mt-1 text-xs text-maroon/60">{{ formatDateTime(agencyNote.createdAt) }}</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </template>
  </section>
</template>