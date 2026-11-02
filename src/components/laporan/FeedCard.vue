<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  BadgeCheck,
  Bookmark,
  CircleCheck,
  CircleX,
  Clock,
  ImageIcon,
  Info,
  MapPin,
  MessageCircle,
  ThumbsUp,
} from 'lucide-vue-next'
import { assetUrl } from '@/api'
import { supportApi } from '@/api/support.api'
import { useAuth } from '@/composables/useAuth'
import { ROLES } from '@/constants/roles'
import { REPORT_STATUS, STATUS_META } from '@/constants/status'
import { timeAgo } from '@/utils/formatDate'
import { formatDistance, formatReporter } from '@/utils/formatStatus'

/**
 * FeedCard: satu laporan di grid feed. `report` = satu item dari GET /reports.
 *
 * Seluruh kartu bisa diklik (tautan di judul dibentangkan), sementara tombol Dukung / Verifikasi
 * / Simpan tetap berdiri sendiri di atasnya. Dukung dan Verifikasi diperbarui langsung di layar
 * (optimistic), lalu disamakan dengan jawaban server; kalau gagal, angkanya dikembalikan.
 */
const props = defineProps({
  report: { type: Object, required: true },
})

const route = useRoute()
const router = useRouter()
const { isLoggedIn, role } = useAuth()

// ---- Tampilan ----------------------------------------------------------------

// Ikon + warna lencana status. Label default dari STATUS_META; `label` di sini menimpanya.
const STATUS_UI = {
  [REPORT_STATUS.MENUNGGU_VERIFIKASI]: { icon: Clock, tone: 'bg-sky-100 text-sky-800' },
  [REPORT_STATUS.TERVERIFIKASI]: { icon: CircleCheck, tone: 'bg-emerald-100 text-emerald-800' },
  [REPORT_STATUS.DITOLAK]: { icon: CircleX, tone: 'bg-orange-100 text-red-700' },
  [REPORT_STATUS.DITERUSKAN]: { icon: Info, tone: 'bg-blue-100 text-blue-800', label: 'Diteruskan ke Instansi' },
  [REPORT_STATUS.DALAM_PENANGANAN]: { icon: Clock, tone: 'bg-amber-100 text-amber-800' },
  [REPORT_STATUS.SELESAI]: { icon: CircleCheck, tone: 'bg-lime/60 text-emerald-900' },
}
const statusUi = computed(() => STATUS_UI[props.report.status] ?? { icon: Info, tone: 'bg-sand text-maroon' })
const statusLabel = computed(
  () => statusUi.value.label ?? STATUS_META[props.report.status]?.label ?? props.report.status,
)

const cover = computed(() => assetUrl(props.report.photos?.[0]?.url))
const photoCount = computed(() => props.report.photos?.length ?? 0)
const place = computed(() => props.report.district?.name || props.report.address || 'Lokasi tidak tersedia')

// Laporan belum punya judul; dirangkai dari subjenis + alamat ("Jalan berlubang di Jl. Terusan Jakarta").
const title = computed(() => {
  if (props.report.title) return props.report.title
  const type = props.report.subcategory?.name ?? 'Laporan'
  return props.report.address ? `${type} di ${props.report.address}` : type
})

const reporterName = computed(() => formatReporter(props.report))
const avatar = computed(() => assetUrl(props.report.reporter?.avatarUrl))
const initial = computed(() => reporterName.value?.trim()?.[0]?.toUpperCase() ?? '?')
const hasDistance = computed(
  () => props.report.distanceMeters !== null && props.report.distanceMeters !== undefined,
)
const showRejection = computed(
  () => props.report.status === REPORT_STATUS.DITOLAK && props.report.rejectionReason,
)

// ---- Dukung & verifikasi -------------------------------------------------------

const counts = reactive({ upvote: 0, verify: 0 })
const mine = reactive({ upvote: false, verify: false })
const busy = reactive({ upvote: false, verify: false })

function syncFromProps() {
  counts.upvote = props.report.stats?.upvotes ?? 0
  counts.verify = props.report.stats?.verifications ?? 0
  mine.upvote = props.report.viewer?.hasUpvoted ?? false
  mine.verify = props.report.viewer?.hasVerified ?? false
}
syncFromProps()
watch(() => props.report, syncFromProps)

// Alasan tombol tidak bisa dipakai. Tamu tidak dihitung: tombolnya aktif dan mengarah ke Masuk.
const blockedReason = computed(() => {
  if (!isLoggedIn.value) return ''
  if (role.value !== ROLES.WARGA) return 'Hanya akun warga yang dapat memberi dukungan'
  if (props.report.viewer?.isOwner) return 'Kamu tidak bisa mendukung laporanmu sendiri'
  return ''
})

// Pesan singkat di dalam kartu (menggantikan toast, hilang sendiri).
const notice = ref('')
let noticeTimer = null
function showNotice(message) {
  notice.value = message
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => (notice.value = ''), 3500)
}
onBeforeUnmount(() => clearTimeout(noticeTimer))

function goToLogin() {
  router.push({ name: 'masuk', query: { redirect: route.fullPath } })
}

async function toggle(kind) {
  if (!isLoggedIn.value) return goToLogin()
  if (blockedReason.value) return showNotice(blockedReason.value)
  if (busy[kind]) return

  const next = !mine[kind]
  const delta = next ? 1 : -1

  // Tampilkan hasilnya dulu...
  mine[kind] = next
  counts[kind] = Math.max(0, counts[kind] + delta)
  busy[kind] = true

  try {
    const { data: body } = next
      ? await supportApi.add(props.report.id, kind)
      : await supportApi.remove(props.report.id, kind)

    // ...lalu samakan dengan angka dari server.
    const state = body.data
    counts[kind] = kind === 'upvote' ? state.stats.upvotes : state.stats.verifications
    mine[kind] = kind === 'upvote' ? state.viewer.hasUpvoted : state.viewer.hasVerified
  } catch (e) {
    mine[kind] = !next
    counts[kind] = Math.max(0, counts[kind] - delta)
    showNotice(e.normalized?.message ?? 'Gagal menyimpan dukungan')
  } finally {
    busy[kind] = false
  }
}

// ---- Simpan (bookmark) ---------------------------------------------------------
// DUMMY: baru tersimpan di kartu ini. Sambungkan ke BE kalau endpoint simpan laporan sudah ada.
const saved = ref(false)
function toggleSave() {
  if (!isLoggedIn.value) return goToLogin()
  saved.value = !saved.value
}

const statButton =
  'relative z-10 -m-1 inline-flex cursor-pointer items-center gap-1.5 rounded-md p-1 transition-colors ' +
  'hover:text-maroon-dark aria-disabled:cursor-not-allowed aria-disabled:opacity-50'
</script>

<template>
  <article
    class="relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_4px_16px_-6px_rgba(68,36,45,.25)] transition-shadow hover:shadow-lg has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-maroon"
  >
    <div class="relative aspect-[16/10] bg-sand">
      <img
        v-if="cover"
        :src="cover"
        :alt="`Foto laporan ${report.trackingCode ?? ''}`"
        loading="lazy"
        class="size-full object-cover"
      />
      <ImageIcon
        v-else
        class="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 text-maroon/30"
        aria-hidden="true"
      />

      <span class="absolute left-2.5 top-2.5 inline-flex max-w-[70%] items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold">
        <MapPin class="size-3 shrink-0" aria-hidden="true" /><span class="truncate">{{ place }}</span>
      </span>
      <span
        v-if="photoCount > 0"
        class="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-maroon/75 px-2.5 py-1 text-[11px] font-semibold text-white"
      >
        <ImageIcon class="size-3" aria-hidden="true" /> {{ photoCount }}
        <span class="sr-only">foto</span>
      </span>
    </div>

    <div class="flex flex-1 flex-col p-4">
      <span
        class="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
        :class="statusUi.tone"
      >
        <component :is="statusUi.icon" class="size-3.5" aria-hidden="true" /> {{ statusLabel }}
      </span>

      <h3 class="mt-2.5 line-clamp-2 min-h-[2.9rem] text-[17px] font-extrabold leading-snug">
        <RouterLink
          :to="{ name: 'detail-laporan', params: { id: report.id } }"
          class="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
        >{{ title }}</RouterLink>
      </h3>

      <p v-if="showRejection" class="mt-1 text-xs font-semibold text-red-700">
        Alasan penolakan: {{ report.rejectionReason }}
      </p>

      <div class="relative z-10 my-3 flex items-center gap-4 text-sm font-semibold">
        <button
          type="button"
          :class="[statButton, mine.upvote && '[&>svg]:fill-lime']"
          :aria-pressed="mine.upvote"
          :aria-disabled="Boolean(blockedReason)"
          :aria-label="`${mine.upvote ? 'Batalkan dukungan' : 'Dukung laporan'}, ${counts.upvote} dukungan`"
          :title="blockedReason || 'Dukung agar laporan ini diprioritaskan'"
          @click="toggle('upvote')"
        >
          <ThumbsUp class="size-[18px]" aria-hidden="true" /> {{ counts.upvote }}
        </button>

        <RouterLink
          :to="{ name: 'detail-laporan', params: { id: report.id }, hash: '#komentar' }"
          :class="statButton"
          :aria-label="`${report.stats?.comments ?? 0} komentar`"
        >
          <MessageCircle class="size-[18px]" aria-hidden="true" /> {{ report.stats?.comments ?? 0 }}
        </RouterLink>

        <button
          type="button"
          :class="[statButton, mine.verify && '[&>svg]:fill-lime']"
          :aria-pressed="mine.verify"
          :aria-disabled="Boolean(blockedReason)"
          :aria-label="`${mine.verify ? 'Batalkan verifikasi' : 'Verifikasi laporan'}, ${counts.verify} verifikasi`"
          :title="blockedReason || 'Konfirmasi bahwa masalah ini benar ada'"
          @click="toggle('verify')"
        >
          <BadgeCheck class="size-[18px]" aria-hidden="true" /> {{ counts.verify }}
        </button>

        <button
          type="button"
          :class="[statButton, 'ml-auto']"
          :aria-pressed="saved"
          :aria-label="saved ? 'Hapus dari simpanan' : 'Simpan laporan'"
          @click="toggleSave"
        >
          <Bookmark class="size-[18px]" :class="{ 'fill-maroon': saved }" aria-hidden="true" />
        </button>
      </div>

      <p v-if="notice" class="mb-2 text-xs font-semibold text-red-700" role="status">{{ notice }}</p>

      <div class="mt-auto flex items-center gap-2.5 border-t border-sand pt-3">
        <img v-if="avatar" :src="avatar" alt="" loading="lazy" class="size-8 rounded-full object-cover" />
        <span v-else class="flex size-8 items-center justify-center rounded-full bg-maroon text-xs font-bold text-lime" aria-hidden="true">{{ initial }}</span>
        <div class="min-w-0 leading-tight">
          <p class="truncate text-xs font-bold">{{ reporterName }}</p>
          <p class="text-[11px] text-maroon/70">
            {{ timeAgo(report.createdAt) }}<template v-if="hasDistance"> · {{ formatDistance(report.distanceMeters) }}</template>
          </p>
        </div>
      </div>
    </div>
  </article>
</template>