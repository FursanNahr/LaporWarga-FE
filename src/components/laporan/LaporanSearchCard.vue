<script setup>
import { computed } from 'vue'
import {
  BadgeCheck,
  Calendar,
  CircleCheck,
  CircleX,
  Clock,
  CornerUpRight,
  Image as ImageIcon,
  ImageOff,
  MapPin,
  MessageCircle,
  ThumbsUp,
} from 'lucide-vue-next'
import { assetUrl } from '@/api'
import { REPORT_STATUS } from '@/constants/status'
import { formatDate } from '@/utils/formatDate'
import { formatDistance, statusLabel } from '@/utils/formatStatus'

/**
 * LaporanSearchCard: kartu hasil pencarian (halaman Cari Laporan).
 * `report` = satu item dari GET /reports. Seluruh kartu bisa diklik menuju halaman detail.
 * Kartu untuk Laporan Saya tetap memakai LaporanCard.vue (tidak diubah).
 */
const props = defineProps({
  report: { type: Object, required: true },
})

// Lencana di atas foto: ikon + warna per status. Label diambil dari constants/status.js.
const STATUS_STYLE = {
  [REPORT_STATUS.MENUNGGU_VERIFIKASI]: { icon: Clock, pill: 'bg-amber-100', iconClass: 'text-amber-600' },
  [REPORT_STATUS.TERVERIFIKASI]: { icon: BadgeCheck, pill: 'bg-white', iconClass: 'text-maroon' },
  [REPORT_STATUS.DITOLAK]: { icon: CircleX, pill: 'bg-white', iconClass: 'text-red-600' },
  [REPORT_STATUS.DITERUSKAN]: { icon: CornerUpRight, pill: 'bg-amber-100', iconClass: 'text-amber-600' },
  [REPORT_STATUS.DALAM_PENANGANAN]: { icon: Clock, pill: 'bg-sky-100', iconClass: 'text-sky-700' },
  [REPORT_STATUS.SELESAI]: { icon: CircleCheck, pill: 'bg-lime', iconClass: 'text-emerald-700' },
}
const FALLBACK_STYLE = { icon: Clock, pill: 'bg-white', iconClass: 'text-maroon' }

const statusStyle = computed(() => STATUS_STYLE[props.report.status] ?? FALLBACK_STYLE)

const photo = computed(() => assetUrl(props.report.photos?.[0]?.url))
const photoCount = computed(() => props.report.photos?.length ?? 0)

// Data hanya punya `description`, jadi dipakai sebagai judul (dipotong 2 baris lewat line-clamp).
const title = computed(() => props.report.description || props.report.trackingCode)

// "Kec. Sukajadi"; kalau nama sudah berawalan "Kec", dipakai apa adanya. Tanpa kecamatan: alamat.
const place = computed(() => {
  const name = props.report.district?.name
  if (name) return /^kec/i.test(name) ? name : `Kec. ${name}`
  return props.report.address || ''
})

const distance = computed(() => {
  const meters = props.report.distanceMeters
  return meters === null || meters === undefined ? '' : formatDistance(meters)
})

const stats = computed(() => {
  const s = props.report.stats ?? {}
  return [
    { key: 'upvotes', icon: ThumbsUp, value: s.upvotes ?? 0, label: 'dukungan' },
    { key: 'verifications', icon: BadgeCheck, value: s.verifications ?? 0, label: 'verifikasi' },
    { key: 'comments', icon: MessageCircle, value: s.comments ?? 0, label: 'komentar' },
  ]
})
</script>

<template>
  <article
    class="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-sand-dark bg-cream shadow-sm transition duration-200 focus-within:ring-2 focus-within:ring-maroon hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0"
  >
    <div class="relative aspect-[16/10] overflow-hidden bg-sand">
      <img
        v-if="photo"
        :src="photo"
        :alt="`Foto laporan ${report.trackingCode}`"
        loading="lazy"
        class="size-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
      <div v-else class="grid size-full place-items-center gap-1 text-maroon/50">
        <ImageOff class="size-8" aria-hidden="true" />
        <span class="text-xs font-semibold">Tanpa foto</span>
      </div>

      <span
        class="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-maroon shadow-sm"
        :class="statusStyle.pill"
      >
        <component :is="statusStyle.icon" class="size-4" :class="statusStyle.iconClass" aria-hidden="true" />
        {{ statusLabel(report.status) }}
      </span>

      <span
        v-if="photoCount > 0"
        class="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-maroon-dark/80 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm"
        :title="`${photoCount} foto`"
      >
        <ImageIcon class="size-3.5" aria-hidden="true" />
        {{ photoCount }}
      </span>
    </div>

    <div class="flex flex-1 flex-col gap-2 p-4">
      <p class="text-xs font-semibold tracking-wide text-maroon/60">{{ report.trackingCode }}</p>

      <!-- Link "stretched": area klik meliputi seluruh kartu -->
      <h3 class="min-h-[2.75rem] text-base font-bold leading-snug text-maroon">
        <RouterLink
          :to="{ name: 'detail-laporan', params: { id: report.id } }"
          class="line-clamp-2 after:absolute after:inset-0 after:z-10 focus-visible:outline-none"
        >
          {{ title }}
        </RouterLink>
      </h3>

      <ul class="flex flex-col gap-1.5 text-sm text-maroon/75">
        <li v-if="place" class="flex items-center gap-2">
          <MapPin class="size-4 shrink-0" aria-hidden="true" />
          <span class="truncate">{{ place }}</span>
          <span v-if="distance" class="shrink-0 text-xs font-semibold text-maroon/60">· {{ distance }}</span>
        </li>
        <li class="flex items-center gap-2">
          <Calendar class="size-4 shrink-0" aria-hidden="true" />
          <span>{{ formatDate(report.createdAt) }}</span>
        </li>
      </ul>

      <div class="mt-auto flex items-center gap-4 border-t border-sand-dark pt-3 text-xs font-semibold text-maroon/70">
        <span
          v-for="stat in stats"
          :key="stat.key"
          class="inline-flex items-center gap-1.5"
          :title="`${stat.value} ${stat.label}`"
        >
          <component :is="stat.icon" class="size-4" aria-hidden="true" />
          {{ stat.value }}
          <span class="sr-only">{{ stat.label }}</span>
        </span>
      </div>
    </div>
  </article>
</template>