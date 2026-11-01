<script setup>
import { computed } from 'vue'
import { ImageIcon, MapPin, ThumbsUp, MessageCircle } from 'lucide-vue-next'
import { STATUS_META } from '@/constants/status'
import { useSafeLink } from '@/composables/useSafeLink'
import { mediaUrl } from '@/utils/media'
import { timeAgo } from '@/utils/formatDate'

const props = defineProps({ report: { type: Object, required: true } })
const link = useSafeLink()

// Warna badge per status (gaya desain). Status di luar daftar memakai abu-abu.
const BADGE = {
  TERVERIFIKASI: 'bg-sky-100 text-sky-800',
  DITERUSKAN: 'bg-indigo-100 text-indigo-800',
  DALAM_PENANGANAN: 'bg-amber-100 text-amber-800',
  SELESAI: 'bg-lime/60 text-emerald-900',
  MENUNGGU_VERIFIKASI: 'bg-sky-100 text-sky-800',
}

const photo = computed(() => mediaUrl(props.report.photos?.[0]?.url))
const place = computed(() => props.report.district?.name || props.report.address || 'Lokasi tidak tersedia')
const statusLabel = computed(() => STATUS_META[props.report.status]?.label ?? props.report.status)
const badgeClass = computed(() => BADGE[props.report.status] ?? 'bg-gray-100 text-gray-700')
const reporterName = computed(() => (props.report.isAnonymous ? 'Anonim' : props.report.reporter?.name || 'Warga'))
const initial = computed(() => reporterName.value.charAt(0).toUpperCase())
// Rute detail: sesuaikan nama route & param kalau di publik.routes.js berbeda.
const to = computed(() => link('detail-laporan', { id: props.report.id }))
</script>

<template>
  <article class="overflow-hidden rounded-2xl bg-white shadow-[0_4px_16px_-6px_rgba(68,36,45,.25)] transition-shadow focus-within:shadow-lg hover:shadow-lg">
    <RouterLink :to="to" class="block focus-visible:outline-offset-[-3px]">
      <div class="relative aspect-[16/10] bg-sand">
        <img v-if="photo" :src="photo" :alt="`Foto laporan: ${report.subcategory?.name ?? ''}`" loading="lazy" class="size-full object-cover" />
        <ImageIcon v-else class="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 text-maroon/30" aria-hidden="true" />
        <span class="absolute left-2.5 top-2.5 inline-flex max-w-[70%] items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold">
          <MapPin class="size-3 shrink-0" aria-hidden="true" /><span class="truncate">{{ place }}</span>
        </span>
        <span class="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-maroon/75 px-2.5 py-1 text-[11px] font-semibold text-white">
          <ImageIcon class="size-3" aria-hidden="true" /> {{ report.photos?.length ?? 0 }}
        </span>
      </div>

      <div class="p-4">
        <span class="inline-block rounded-full px-2.5 py-1 text-[11px] font-bold" :class="badgeClass">{{ statusLabel }}</span>
        <h3 class="mt-2.5 line-clamp-2 min-h-[2.75rem] text-base font-extrabold leading-snug">{{ report.subcategory?.name }}</h3>
        <div class="mt-3 flex items-center gap-4 text-sm">
          <span class="inline-flex items-center gap-1.5"><ThumbsUp class="size-4" aria-hidden="true" /> {{ report.stats?.upvotes ?? 0 }}<span class="sr-only"> dukungan</span></span>
          <span class="inline-flex items-center gap-1.5"><MessageCircle class="size-4" aria-hidden="true" /> {{ report.stats?.comments ?? 0 }}<span class="sr-only"> komentar</span></span>
        </div>
        <div class="mt-3 flex items-center gap-2.5 border-t border-sand pt-3">
          <img v-if="report.reporter?.avatarUrl && !report.isAnonymous" :src="mediaUrl(report.reporter.avatarUrl)" alt="" class="size-8 rounded-full object-cover" />
          <span v-else class="flex size-8 items-center justify-center rounded-full bg-maroon text-xs font-bold text-lime">{{ initial }}</span>
          <div class="min-w-0 leading-tight">
            <p class="truncate text-xs font-bold">{{ reporterName }}</p>
            <p class="text-[11px] text-maroon/70">{{ timeAgo(report.createdAt) }}</p>
          </div>
        </div>
      </div>
    </RouterLink>
  </article>
</template>
