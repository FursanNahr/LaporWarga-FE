<script setup>
import { computed } from 'vue'
import { ArrowRight, Building2, Calendar, Check, ImageIcon, MapPin } from 'lucide-vue-next'
import { STATUS_META } from '@/constants/status'
import { mediaUrl } from '@/utils/media'

/** Satu baris laporan di daftar kerja instansi (pages/instansi/DaftarLaporanPage.vue). */
const props = defineProps({ report: { type: Object, required: true } })

const photo = computed(() => mediaUrl(props.report.photos?.[0]?.url))
const title = computed(() => props.report.description || props.report.subcategory?.name || 'Laporan')
const place = computed(() => props.report.district?.name || props.report.address || 'Lokasi tidak tersedia')

const reportedAt = computed(() => {
  const d = new Date(props.report.createdAt)
  if (Number.isNaN(d.getTime())) return ''
  const date = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  return `${date}, ${time}`
})

// Empat langkah yang terlihat instansi. Laporan di daftar ini minimal sudah "Diteruskan".
const STEP_LABELS = ['Menunggu Verifikasi', 'Diteruskan ke Instansi', 'Dalam Penanganan', 'Selesai']
const CURRENT_INDEX = { DITERUSKAN: 1, DALAM_PENANGANAN: 2, SELESAI: 3 }
const steps = computed(() => {
  const current = CURRENT_INDEX[props.report.status] ?? 1
  const allDone = props.report.status === 'SELESAI'
  return STEP_LABELS.map((label, i) => ({
    label,
    state: allDone || i < current ? 'done' : i === current ? 'active' : 'todo',
  }))
})

const BADGE = {
  DITERUSKAN: 'bg-indigo-100 text-indigo-800',
  DALAM_PENANGANAN: 'bg-amber-100 text-amber-800',
  SELESAI: 'bg-lime/60 text-emerald-900',
}
const statusLabel = computed(() => STATUS_META[props.report.status]?.label ?? props.report.status)
const badgeClass = computed(() => BADGE[props.report.status] ?? 'bg-gray-100 text-gray-700')
</script>

<template>
  <article
    class="grid gap-4 rounded-2xl border border-sand-dark bg-white/60 p-4 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:p-5 2xl:grid-cols-[7.5rem_minmax(0,1fr)_12.5rem_auto] 2xl:items-center"
  >
    <!-- Foto -->
    <div class="relative aspect-[16/9] overflow-hidden rounded-xl bg-sand sm:aspect-[5/4] sm:self-start">
      <img v-if="photo" :src="photo" :alt="`Foto laporan ${report.trackingCode}`" loading="lazy" class="size-full object-cover" />
      <ImageIcon v-else class="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 text-maroon/30" aria-hidden="true" />
    </div>

    <!-- Info -->
    <div class="min-w-0">
      <h3 class="truncate text-base font-extrabold" :title="title">{{ title }}</h3>
      <p class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span class="inline-flex min-w-0 items-center gap-1.5"><MapPin class="size-4 shrink-0" aria-hidden="true" /><span class="truncate">{{ place }}</span></span>
        <span v-if="report.agency?.name" class="inline-flex min-w-0 items-center gap-1.5"><Building2 class="size-4 shrink-0" aria-hidden="true" /><span class="truncate">{{ report.agency.name }}</span></span>
      </p>
      <p class="mt-1 inline-flex items-center gap-1.5 text-sm"><Calendar class="size-4 shrink-0" aria-hidden="true" /> Dilaporkan pada {{ reportedAt }}</p>
      <p class="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
        <span v-if="report.subcategory?.category?.name" class="rounded-full bg-sand px-3 py-1">Kategori: {{ report.subcategory.category.name }}</span>
        <span class="rounded-full bg-sand px-3 py-1">Kode: {{ report.trackingCode }}</span>
      </p>
    </div>

    <!-- Langkah progres + aksi. Di layar 2xl wadah ini "dilebur" jadi kolom grid sendiri. -->
    <div class="flex flex-wrap items-center justify-between gap-4 border-t border-sand-dark pt-4 sm:col-span-2 2xl:contents">
      <ol class="flex flex-wrap gap-x-5 gap-y-1.5 2xl:flex-col 2xl:gap-y-2 2xl:border-l 2xl:border-maroon/25 2xl:pl-4" aria-label="Tahap penanganan">
        <li v-for="step in steps" :key="step.label" class="flex items-center gap-2 text-sm" :aria-current="step.state === 'active' ? 'step' : undefined">
          <span v-if="step.state === 'done'" class="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"><Check class="size-3" stroke-width="3" aria-hidden="true" /></span>
          <span v-else-if="step.state === 'active'" class="size-4 shrink-0 rounded-full bg-maroon ring-2 ring-maroon/30 ring-offset-1"></span>
          <span v-else class="size-4 shrink-0 rounded-full bg-sand-dark"></span>
          <span :class="step.state === 'todo' ? 'text-maroon/60' : 'font-medium'">{{ step.label }}</span>
        </li>
      </ol>

      <div class="flex flex-wrap items-center gap-3 2xl:flex-col 2xl:items-stretch">
        <span class="inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-bold" :class="badgeClass">{{ statusLabel }}</span>
        <RouterLink
          :to="{ name: 'instansi-kelola-progress', params: { id: report.id } }"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-full border-2 border-maroon px-5 text-sm font-bold transition-colors hover:bg-maroon hover:text-white"
        >
          Lihat Detail <ArrowRight class="size-4" aria-hidden="true" />
        </RouterLink>
      </div>
    </div>
  </article>
</template>
