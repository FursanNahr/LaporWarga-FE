<script setup>
import { computed } from 'vue'
import { REPORT_STATUS, STATUS_META } from '@/constants/status'

/**
 * StatusPill: lencana status laporan bergaya halaman Detail (tanpa ikon, warna per status).
 * Label default dari STATUS_META; `LABEL` di bawah menimpanya.
 * Untuk BaseBadge versi lama tetap pakai StatusBadge.vue.
 */
const props = defineProps({
  status: { type: String, required: true },
})

const TONE = {
  [REPORT_STATUS.MENUNGGU_VERIFIKASI]: 'bg-amber-100 text-amber-900',
  [REPORT_STATUS.TERVERIFIKASI]: 'bg-sky-100 text-sky-900',
  [REPORT_STATUS.DITOLAK]: 'bg-red-100 text-red-800',
  [REPORT_STATUS.DITERUSKAN]: 'bg-violet-100 text-violet-800',
  [REPORT_STATUS.DALAM_PENANGANAN]: 'bg-blue-100 text-blue-800',
  [REPORT_STATUS.SELESAI]: 'bg-lime/60 text-emerald-900',
}
const LABEL = {
  [REPORT_STATUS.DITERUSKAN]: 'Diteruskan ke Instansi',
}

const tone = computed(() => TONE[props.status] ?? 'bg-sand text-maroon')
const label = computed(() => LABEL[props.status] ?? STATUS_META[props.status]?.label ?? props.status)
</script>

<template>
  <span class="inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-bold" :class="tone">{{ label }}</span>
</template>