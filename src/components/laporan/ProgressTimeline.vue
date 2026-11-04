<script setup>
import { computed } from 'vue'
import { ArrowRight, Check, CircleCheck, Clock, Wrench, X } from 'lucide-vue-next'
import { assetUrl } from '@/api'
import { REPORT_STATUS, STATUS_META } from '@/constants/status'
import { formatDateTime } from '@/utils/formatDate'
import { formatDistance, humanizeEnum } from '@/utils/formatStatus'
import StatusBadge from '@/components/laporan/StatusBadge.vue'
import StatusPill from '@/components/laporan/StatusPill.vue'

/**
 * ProgressTimeline: riwayat progres laporan.
 * `items` = report.timeline dari GET /reports/:id, tiap item:
 *   { id, fromStatus, toStatus, note, createdAt, actor: { name, role }, attachments: [...] }
 *
 * Default (dipakai halaman admin dan instansi): urut lama -> baru, tiap entri "dari -> ke".
 * `friendly` (halaman Detail publik): satu lencana per entri dan catatan bawaan kalau petugas
 * tidak menulis catatan. `newestFirst`: yang terbaru di atas.
 * `variant="card"`: gaya kartu "Progres Laporan" (judul tebal + tanggal + catatan, titik hijau).
 * Variant card otomatis memakai catatan bawaan seperti `friendly`.
 */
const props = defineProps({
  items: { type: Array, default: () => [] },
  newestFirst: { type: Boolean, default: false },
  friendly: { type: Boolean, default: false },
  variant: { type: String, default: 'default' }, // default | card
})

const isCard = computed(() => props.variant === 'card')
const rows = computed(() => (props.newestFirst ? [...props.items].reverse() : props.items))
// Entri terakhir (kronologis) = tahap yang sedang berjalan.
const currentId = computed(() => props.items.at(-1)?.id ?? null)

// Ikon di titik timeline mengikuti status tujuan.
const NODE_ICON = {
  [REPORT_STATUS.MENUNGGU_VERIFIKASI]: Clock,
  [REPORT_STATUS.TERVERIFIKASI]: Check,
  [REPORT_STATUS.DITOLAK]: X,
  [REPORT_STATUS.DITERUSKAN]: ArrowRight,
  [REPORT_STATUS.DALAM_PENANGANAN]: Wrench,
  [REPORT_STATUS.SELESAI]: CircleCheck,
}
const NODE_TONE = {
  [REPORT_STATUS.SELESAI]: 'border-emerald-600 bg-emerald-600 text-white',
  [REPORT_STATUS.DITOLAK]: 'border-red-300 bg-red-50 text-red-700',
}
const nodeIcon = (item) => NODE_ICON[item.toStatus] ?? Clock
function nodeTone(item) {
  if (!isCard.value) return NODE_TONE[item.toStatus] ?? 'border-sand-dark bg-white text-maroon'
  // Gaya card: semua tahap hijau, tahap berjalan lebih gelap, ditolak tetap merah.
  if (item.toStatus === REPORT_STATUS.DITOLAK) return NODE_TONE[REPORT_STATUS.DITOLAK]
  return item.id === currentId.value
    ? 'border-emerald-700 bg-emerald-700 text-white'
    : 'border-emerald-500 bg-emerald-500 text-white'
}

const DEFAULT_NOTE = {
  [REPORT_STATUS.MENUNGGU_VERIFIKASI]: 'Laporan diterima dan menunggu verifikasi.',
  [REPORT_STATUS.TERVERIFIKASI]: 'Laporan telah diverifikasi oleh admin.',
  [REPORT_STATUS.DITOLAK]: 'Laporan ditolak.',
  [REPORT_STATUS.DITERUSKAN]: 'Laporan diteruskan ke instansi yang menangani.',
  [REPORT_STATUS.DALAM_PENANGANAN]: 'Petugas mulai menangani laporan.',
  [REPORT_STATUS.SELESAI]: 'Laporan telah ditangani dan diselesaikan oleh instansi.',
}
function noteOf(item) {
  if (item.note) return item.note
  if (!props.friendly && !isCard.value) return ''
  // Status tidak berubah = catatan tanpa isi.
  return item.fromStatus === item.toStatus ? 'Petugas memperbarui progres.' : (DEFAULT_NOTE[item.toStatus] ?? '')
}

// Judul tahap untuk variant card.
const CARD_TITLE = {
  [REPORT_STATUS.DITERUSKAN]: 'Diteruskan ke Instansi',
}
function cardTitle(item) {
  if (item.fromStatus && item.fromStatus === item.toStatus) return 'Catatan Progres'
  return CARD_TITLE[item.toStatus] ?? STATUS_META[item.toStatus]?.label ?? item.toStatus
}

const isImage = (attachment) => /\.(jpe?g|png|webp|gif)$/i.test(attachment.url || attachment.fileName || '')
const hasDistance = (attachment) =>
  attachment.distanceFromReportM !== null && attachment.distanceFromReportM !== undefined
</script>

<template>
  <ol
    v-if="rows.length"
    class="relative before:absolute before:w-0.5 before:-translate-x-1/2"
    :class="
      isCard
        ? 'before:inset-y-4 before:left-4 before:bg-emerald-200'
        : 'before:inset-y-5 before:left-5 before:bg-sand-dark'
    "
  >
    <li
      v-for="item in rows"
      :key="item.id"
      class="group relative last:pb-0"
      :class="isCard ? 'pb-6 pl-12' : 'pb-5 pl-16'"
    >
      <span
        class="absolute left-0 top-0 grid place-items-center rounded-full border-2"
        :class="[isCard ? 'size-8' : 'size-10', nodeTone(item)]"
        aria-hidden="true"
      >
        <component :is="nodeIcon(item)" :class="isCard ? 'size-4' : 'size-[18px]'" />
      </span>

      <div :class="isCard ? '' : 'border-b border-sand-dark/60 pb-5 group-last:border-b-0 group-last:pb-0'">
        <!-- Gaya card: judul tebal + tanggal -->
        <div v-if="isCard">
          <p class="text-sm font-extrabold leading-8">{{ cardTitle(item) }}</p>
          <time class="-mt-1 block text-xs text-maroon/70" :datetime="item.createdAt">{{ formatDateTime(item.createdAt) }}</time>
        </div>

        <!-- Gaya bawaan: lencana status + tanggal -->
        <div v-else class="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <template v-if="!friendly && item.fromStatus">
              <StatusBadge :status="item.fromStatus" />
              <span aria-label="menjadi">→</span>
            </template>
            <StatusPill v-if="friendly" :status="item.toStatus" />
            <StatusBadge v-else :status="item.toStatus" />
          </div>
          <time class="text-xs text-maroon/70" :datetime="item.createdAt">{{ formatDateTime(item.createdAt) }}</time>
        </div>

        <p
          v-if="noteOf(item)"
          :class="isCard ? 'mt-1 text-xs leading-relaxed text-maroon/80' : 'mt-2 text-sm'"
        >
          {{ noteOf(item) }}
        </p>

        <p class="mt-1 text-xs text-maroon/60">
          {{ item.actor?.name }}<template v-if="item.actor?.role"> ({{ humanizeEnum(item.actor.role) }})</template>
        </p>

        <ul v-if="item.attachments?.length" class="mt-3 flex flex-wrap gap-3">
          <li v-for="attachment in item.attachments" :key="attachment.id" class="max-w-40">
            <a
              :href="assetUrl(attachment.url)"
              target="_blank"
              rel="noopener"
              class="block overflow-hidden rounded-xl border border-sand-dark hover:border-maroon"
            >
              <img
                v-if="isImage(attachment)"
                :src="assetUrl(attachment.url)"
                :alt="`Lampiran ${humanizeEnum(attachment.kind)}`"
                loading="lazy"
                class="block h-[84px] w-28 object-cover"
              />
              <span v-else class="block px-3 py-2 text-sm font-semibold underline">{{ attachment.fileName || 'Buka lampiran' }}</span>
            </a>
            <span class="mt-1 block text-xs text-maroon/60">
              {{ humanizeEnum(attachment.kind) }}
              <template v-if="attachment.capturedAt"> · {{ formatDateTime(attachment.capturedAt) }}</template>
              <template v-if="hasDistance(attachment)"> · {{ formatDistance(attachment.distanceFromReportM) }} dari lokasi laporan</template>
            </span>
          </li>
        </ul>
      </div>
    </li>
  </ol>
  <p v-else class="text-sm text-maroon/60">Belum ada riwayat progres.</p>
</template>