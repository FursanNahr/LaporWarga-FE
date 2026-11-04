<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Bookmark,
  CalendarDays,
  CircleCheck,
  Clock,
  Ellipsis,
  ExternalLink,
  FileText,
  ImageIcon,
  Link2,
  MapPin,
} from 'lucide-vue-next'
import { assetUrl } from '@/api'
import { laporanApi } from '@/api/laporan.api'
import { supportApi } from '@/api/support.api'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { ROLES } from '@/constants/roles'
import { REPORT_STATUS } from '@/constants/status'
import { formatDateTime } from '@/utils/formatDate'
import { formatDistance, formatReporter } from '@/utils/formatStatus'
import BaseModal from '@/components/common/BaseModal.vue'
import ConfirmResolveCard from '@/components/laporan/ConfirmResolveCard.vue'
import DetailCommentBox from '@/components/laporan/DetailCommentBox.vue'
import DetailInfoCard from '@/components/laporan/DetailInfoCard.vue'
import ProgressTimeline from '@/components/laporan/ProgressTimeline.vue'
import StatusPill from '@/components/laporan/StatusPill.vue'

/**
 * DetailLaporanPage: detail satu laporan.
 *
 * Dipakai di DUA rute: `detail-laporan` (PublicLayout, tamu) dan `warga-detail-laporan`
 * (DashboardLayout, warga yang sudah masuk). Isinya sama; yang beda hanya pembungkusnya.
 */
const route = useRoute()
const router = useRouter()
const toast = useToast()
const { isLoggedIn, role } = useAuth()

const report = ref(null)
const loading = ref(true)
const error = ref('')
const notFound = ref(false)

async function fetchReport(id) {
  loading.value = true
  error.value = ''
  notFound.value = false
  report.value = null

  try {
    const { data: body } = await laporanApi.detail(id)
    report.value = body.data
  } catch (e) {
    // BE membalas 404 juga untuk laporan yang belum boleh dilihat (menjaga kerahasiaan)
    if (e.normalized?.status === 404) notFound.value = true
    else error.value = e.normalized?.message ?? 'Gagal memuat laporan'
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, (id) => id && fetchReport(id), { immediate: true })

// ---- Data tampilan ---------------------------------------------------------------

const backTo = computed(() => ({
  name: isLoggedIn.value && role.value === ROLES.WARGA ? 'warga-feed' : 'feed',
}))

const photos = computed(() => report.value?.photos ?? [])

// Foto "sesudah" terbaru dari petugas (lampiran di timeline).
const afterPhoto = computed(() => {
  const list = (report.value?.timeline ?? [])
    .flatMap((item) => item.attachments ?? [])
    .filter((attachment) => attachment.kind === 'FOTO_SESUDAH')
  return list.at(-1) ?? null
})
const afterNote = computed(() => {
  const meters = afterPhoto.value?.distanceFromReportM
  return meters === null || meters === undefined ? '' : `${formatDistance(meters)} dari lokasi laporan`
})

// Laporan belum punya judul; dirangkai dari subjenis + alamat (sama seperti kartu Feed).
const title = computed(() => {
  if (report.value?.title) return report.value.title
  const type = report.value?.subcategory?.name ?? 'Laporan'
  return report.value?.address ? `${type} di ${report.value.address}` : type
})

const place = computed(() => {
  const district = report.value?.district?.name
  if (district) return /^kec/i.test(district) ? district : `Kec. ${district}`
  return report.value?.address || 'Lokasi tidak tersedia'
})

const reporterName = computed(() => (report.value ? formatReporter(report.value) : ''))

const mapUrl = computed(() => {
  const { latitude, longitude } = report.value ?? {}
  if (latitude === undefined || longitude === undefined) return ''
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`
})

// ---- Galeri foto -----------------------------------------------------------------

const gallery = computed(() => [
  ...photos.value.map((photo, index) => ({
    src: assetUrl(photo.url),
    label: photos.value.length > 1 ? `Sebelum (${index + 1}/${photos.value.length})` : 'Sebelum',
    note: '',
  })),
  ...(afterPhoto.value
    ? [{ src: assetUrl(afterPhoto.value.url), label: 'Sesudah', note: afterNote.value }]
    : []),
])
const galleryOpen = ref(false)
const galleryIndex = ref(0)
function openGallery(index) {
  galleryIndex.value = index
  galleryOpen.value = true
}

// ---- Dukung & verifikasi ---------------------------------------------------------
// Logikanya sama dengan FeedCard: tampil dulu (optimistic), lalu disamakan dengan jawaban server.

const counts = reactive({ upvote: 0, verify: 0, comments: 0 })
const mine = reactive({ upvote: false, verify: false })
const busy = reactive({ upvote: false, verify: false })

function syncSupport() {
  counts.upvote = report.value?.stats?.upvotes ?? 0
  counts.verify = report.value?.stats?.verifications ?? 0
  counts.comments = report.value?.stats?.comments ?? 0
  mine.upvote = report.value?.viewer?.hasUpvoted ?? false
  mine.verify = report.value?.viewer?.hasVerified ?? false
}
watch(report, syncSupport)

// Tamu sengaja tidak dihitung: tombolnya aktif dan mengarah ke halaman Masuk.
const blockedReason = computed(() => {
  if (!isLoggedIn.value) return ''
  if (role.value !== ROLES.WARGA) return 'Hanya akun warga yang dapat memberi dukungan'
  if (report.value?.viewer?.isOwner) return 'Kamu tidak bisa mendukung laporanmu sendiri'
  return ''
})

function goToLogin() {
  router.push({ name: 'masuk', query: { redirect: route.fullPath } })
}

async function toggle(kind) {
  if (!isLoggedIn.value) return goToLogin()
  if (blockedReason.value) return toast.info(blockedReason.value)
  if (busy[kind]) return

  const next = !mine[kind]
  const delta = next ? 1 : -1
  mine[kind] = next
  counts[kind] = Math.max(0, counts[kind] + delta)
  busy[kind] = true

  try {
    const id = report.value.id
    const { data: body } = next ? await supportApi.add(id, kind) : await supportApi.remove(id, kind)
    const state = body.data
    counts[kind] = kind === 'upvote' ? state.stats.upvotes : state.stats.verifications
    mine[kind] = kind === 'upvote' ? state.viewer.hasUpvoted : state.viewer.hasVerified
  } catch (e) {
    mine[kind] = !next
    counts[kind] = Math.max(0, counts[kind] - delta)
    toast.error(e.normalized?.message ?? 'Gagal menyimpan dukungan')
  } finally {
    busy[kind] = false
  }
}

// ---- Konfirmasi hanya untuk pelapor, saat laporan Selesai -----------------------------

const canConfirm = computed(
  () => isLoggedIn.value && report.value?.viewer?.isOwner === true && report.value?.status === REPORT_STATUS.SELESAI,
)

// ---- Simpan & menu "⋯" ------------------------------------------------------------

// DUMMY: bookmark baru tersimpan di halaman ini. Sambungkan ke BE kalau endpoint simpan sudah ada.
const saved = ref(false)
function toggleSave() {
  if (!isLoggedIn.value) return goToLogin()
  saved.value = !saved.value
}

const menuOpen = ref(false)
const menuRoot = ref(null)

async function copyLink() {
  menuOpen.value = false
  try {
    await navigator.clipboard.writeText(window.location.href)
    toast.success('Tautan laporan disalin.')
  } catch {
    toast.error('Tautan tidak bisa disalin otomatis.')
  }
}

function onDocumentClick(event) {
  if (menuRoot.value && !menuRoot.value.contains(event.target)) menuOpen.value = false
}
function onKeydown(event) {
  if (event.key === 'Escape') menuOpen.value = false
}
onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  window.removeEventListener('keydown', onKeydown)
})

const card = 'rounded-3xl border border-sand-dark/70 bg-white/70 p-5'
const roundButton =
  'grid size-11 cursor-pointer place-items-center rounded-full border border-sand-dark bg-white/80 transition-colors hover:bg-sand'
const tileLabel =
  'absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-maroon/75 px-3 py-1 text-xs font-bold text-white'
</script>

<template>
  <div class="mx-auto w-full max-w-[1360px] px-4 py-6 sm:px-6 lg:px-8">
    <RouterLink :to="backTo" class="inline-flex items-center gap-2 text-sm font-bold hover:underline">
      <ArrowLeft class="size-4" aria-hidden="true" /> Kembali ke Feed
    </RouterLink>

    <!-- Memuat -->
    <div v-if="loading" class="mt-6 animate-pulse space-y-5" aria-busy="true" aria-label="Memuat laporan">
      <div class="h-6 w-56 rounded-full bg-sand"></div>
      <div class="h-9 w-3/4 rounded bg-sand"></div>
      <div class="grid gap-4 sm:grid-cols-3">
        <div class="h-44 rounded-2xl bg-sand"></div>
        <div class="h-44 rounded-2xl bg-sand"></div>
        <div class="h-44 rounded-2xl bg-sand"></div>
      </div>
      <div class="h-32 rounded-3xl bg-sand"></div>
    </div>

    <!-- Tidak ditemukan / gagal -->
    <div v-else-if="notFound" class="mt-8 rounded-3xl bg-white px-6 py-14 text-center">
      <p class="text-lg font-extrabold">Laporan tidak ditemukan</p>
      <p class="mt-1 text-sm text-maroon/80">Tautannya mungkin salah, atau laporan ini belum bisa dilihat publik.</p>
      <RouterLink :to="backTo" class="mt-5 inline-flex h-11 items-center rounded-full bg-maroon px-6 text-sm font-bold text-white hover:bg-maroon-dark">
        Ke Feed
      </RouterLink>
    </div>

    <div v-else-if="error" class="mt-8 rounded-3xl bg-white px-6 py-14 text-center" role="alert">
      <p class="text-lg font-extrabold">Laporan belum bisa dimuat</p>
      <p class="mt-1 text-sm text-maroon/80">{{ error }}</p>
      <button
        type="button"
        class="mt-5 h-11 cursor-pointer rounded-full bg-maroon px-6 text-sm font-bold text-white hover:bg-maroon-dark"
        @click="fetchReport(route.params.id)"
      >Coba lagi</button>
    </div>

    <!-- Isi -->
    <div v-else-if="report" class="mt-5 xl:grid xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-8">
      <div class="min-w-0 space-y-6">
        <header>
          <div class="flex items-start justify-between gap-3">
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full bg-sand-dark/70 px-3 py-1 text-xs font-bold">{{ report.trackingCode }}</span>
              <StatusPill :status="report.status" />
            </div>

            <div class="flex shrink-0 items-center gap-2">
              <button
                type="button"
                :class="roundButton"
                :aria-pressed="saved"
                :aria-label="saved ? 'Hapus dari simpanan' : 'Simpan laporan'"
                @click="toggleSave"
              >
                <Bookmark class="size-5" :class="{ 'fill-maroon': saved }" aria-hidden="true" />
              </button>

              <div ref="menuRoot" class="relative">
                <button
                  type="button"
                  :class="roundButton"
                  aria-haspopup="menu"
                  :aria-expanded="menuOpen"
                  aria-label="Menu lainnya"
                  @click="menuOpen = !menuOpen"
                >
                  <Ellipsis class="size-5" aria-hidden="true" />
                </button>
                <div
                  v-if="menuOpen"
                  role="menu"
                  class="absolute right-0 top-full z-10 mt-2 w-48 overflow-hidden rounded-2xl border border-sand-dark bg-white shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    class="flex w-full cursor-pointer items-center gap-2.5 px-4 py-3 text-sm font-semibold hover:bg-sand"
                    @click="copyLink"
                  >
                    <Link2 class="size-4" aria-hidden="true" /> Salin tautan
                  </button>
                </div>
              </div>
            </div>
          </div>

          <h1 class="mt-3 text-3xl font-extrabold leading-tight sm:text-[2rem]">{{ title }}</h1>

          <p class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px]">
            <MapPin class="size-[18px] shrink-0" aria-hidden="true" />
            <span>{{ place }}</span>
            <span aria-hidden="true">·</span>
            <span>oleh {{ reporterName }}</span>
          </p>
          <p class="mt-1.5 flex items-center gap-2 text-[15px]">
            <CalendarDays class="size-[18px] shrink-0" aria-hidden="true" />
            Dilaporkan pada {{ formatDateTime(report.createdAt) }}
          </p>
        </header>

        <!-- Foto sebelum, sesudah, dan lokasi -->
        <div class="grid gap-4 sm:grid-cols-[1.25fr_1fr_0.9fr]">
          <button
            v-if="photos.length"
            type="button"
            class="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl bg-sand sm:aspect-auto sm:h-44"
            :aria-label="`Buka foto sebelum penanganan${photos.length > 1 ? `, ${photos.length} foto` : ''}`"
            @click="openGallery(0)"
          >
            <img :src="assetUrl(photos[0].url)" alt="Foto laporan sebelum penanganan" class="size-full object-cover transition-transform group-hover:scale-105" />
            <span :class="tileLabel"><Clock class="size-3.5" aria-hidden="true" /> Sebelum</span>
            <span v-if="photos.length > 1" class="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold">
              <ImageIcon class="size-3.5" aria-hidden="true" /> {{ photos.length }}
            </span>
          </button>
          <div v-else class="grid aspect-[4/3] place-items-center rounded-2xl bg-sand text-sm text-maroon/60 sm:aspect-auto sm:h-44">
            Tanpa foto
          </div>

          <button
            v-if="afterPhoto"
            type="button"
            class="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl bg-sand sm:aspect-auto sm:h-44"
            aria-label="Buka foto sesudah penanganan"
            @click="openGallery(photos.length)"
          >
            <img :src="assetUrl(afterPhoto.url)" alt="Foto sesudah penanganan oleh petugas" class="size-full object-cover transition-transform group-hover:scale-105" />
            <span :class="tileLabel"><CircleCheck class="size-3.5" aria-hidden="true" /> Sesudah</span>
            <span v-if="afterNote" class="absolute inset-x-3 bottom-3 truncate rounded-full bg-white/90 px-3 py-1 text-left text-[11px] font-semibold">
              {{ afterNote }}
            </span>
          </button>
          <div
            v-else
            class="grid aspect-[4/3] place-items-center rounded-2xl border-2 border-dashed border-sand-dark px-4 text-center text-sm text-maroon/60 sm:aspect-auto sm:h-44"
          >
            Belum ada foto sesudah
          </div>

          <div class="relative aspect-[4/3] overflow-hidden rounded-2xl border border-sand-dark bg-[#eaf0e2] sm:aspect-auto sm:h-44">
            <svg viewBox="0 0 240 165" preserveAspectRatio="xMidYMid slice" class="absolute inset-0 size-full" aria-hidden="true">
              <rect x="0" y="105" width="90" height="60" rx="8" fill="#d6e5c8" />
              <rect x="165" y="0" width="75" height="48" rx="8" fill="#d6e5c8" />
              <g stroke="#ffffff" stroke-linecap="round" fill="none">
                <path d="M-10 45 L250 75" stroke-width="12" />
                <path d="M85 -10 L115 175" stroke-width="10" />
                <path d="M-10 128 L250 112" stroke-width="8" />
                <path d="M180 -10 L205 175" stroke-width="7" />
              </g>
              <g transform="translate(106 42)">
                <path d="M14 0a13 13 0 0 0-13 13c0 9 13 25 13 25s13-16 13-25A13 13 0 0 0 14 0z" class="fill-maroon" />
                <circle cx="14" cy="13" r="5" class="fill-cream" />
              </g>
            </svg>
            <a
              v-if="mapUrl"
              :href="mapUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold shadow hover:bg-sand"
            >
              Lihat di Peta <ExternalLink class="size-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>

        <section :class="card" aria-labelledby="deskripsi-laporan">
          <h2 id="deskripsi-laporan" class="flex items-center gap-3 text-lg font-extrabold">
            <FileText class="size-6" aria-hidden="true" /> Deskripsi Laporan
          </h2>
          <p class="mt-3 whitespace-pre-line break-words text-[15px] leading-relaxed">{{ report.description }}</p>
        </section>

        <section :class="card" aria-labelledby="riwayat-progres">
          <h2 id="riwayat-progres" class="flex items-center gap-3 text-lg font-extrabold">
            <Clock class="size-6" aria-hidden="true" /> Riwayat Progres
          </h2>
          <div class="mt-5">
            <ProgressTimeline :items="report.timeline" newest-first friendly />
          </div>
        </section>
      </div>

      <aside class="mt-6 space-y-6 xl:mt-0" aria-label="Informasi dan interaksi">
        <DetailInfoCard :report="report" />
        <DetailCommentBox :counts="counts" :mine="mine" :blocked-reason="blockedReason" @toggle="toggle" />
        <ConfirmResolveCard v-if="canConfirm" :report="report" @changed="fetchReport(report.id)" />
      </aside>
    </div>

    <BaseModal v-model="galleryOpen" title="Foto laporan">
      <figure v-if="gallery[galleryIndex]">
        <img
          :src="gallery[galleryIndex].src"
          :alt="`Foto laporan: ${gallery[galleryIndex].label}`"
          class="max-h-[70vh] w-full rounded-xl bg-sand object-contain"
        />
        <figcaption class="mt-2 text-sm font-semibold">
          {{ gallery[galleryIndex].label }}
          <span v-if="gallery[galleryIndex].note" class="font-normal text-maroon/70"> · {{ gallery[galleryIndex].note }}</span>
        </figcaption>
      </figure>
      <ul v-if="gallery.length > 1" class="mt-3 flex gap-2 overflow-x-auto pb-1">
        <li v-for="(item, index) in gallery" :key="item.src">
          <button
            type="button"
            class="cursor-pointer overflow-hidden rounded-lg border-2"
            :class="index === galleryIndex ? 'border-maroon' : 'border-transparent'"
            :aria-label="`Tampilkan foto ${item.label}`"
            :aria-current="index === galleryIndex"
            @click="galleryIndex = index"
          >
            <img :src="item.src" alt="" class="h-14 w-20 object-cover" />
          </button>
        </li>
      </ul>
    </BaseModal>
  </div>
</template>