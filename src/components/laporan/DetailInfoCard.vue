<script setup>
import { computed } from 'vue'
import { ClipboardList, Clock, LayoutGrid, Landmark, ShieldCheck } from 'lucide-vue-next'
import { REPORT_STATUS } from '@/constants/status'

/**
 * DetailInfoCard: kartu "Informasi Laporan" di kolom kanan halaman Detail.
 *
 * Baris Estimasi dan SLA hanya muncul kalau BE mengirim `report.sla`. Bentuk yang diharapkan
 * (SESUAIKAN kalau BE memakai nama lain): { dueAt: ISO date, isOverdue: boolean }.
 * Tidak ada data = barisnya tidak ditampilkan, tidak diganti angka contoh.
 */
const props = defineProps({
  report: { type: Object, required: true },
})

const category = computed(() => {
  const sub = props.report.subcategory
  if (!sub) return '-'
  return sub.category?.name ? `${sub.category.name} › ${sub.name}` : sub.name
})

const sla = computed(() => props.report.sla ?? null)
const isFinished = computed(() => props.report.status === REPORT_STATUS.SELESAI)

const estimate = computed(() => {
  if (!sla.value?.dueAt || isFinished.value) return ''
  const days = Math.ceil((new Date(sla.value.dueAt).getTime() - Date.now()) / 86400000)
  if (Number.isNaN(days)) return ''
  return days > 0 ? `± ${days} hari lagi` : 'Sudah lewat tenggat'
})

const rowClass = 'grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-0.5 py-3 sm:grid-cols-[9rem_1fr]'
</script>

<template>
  <section class="overflow-hidden rounded-3xl border border-sand-dark/70 bg-white/70" aria-labelledby="info-laporan">
    <h2 id="info-laporan" class="flex items-center gap-3 bg-sand/80 px-5 py-4 text-lg font-extrabold">
      <ClipboardList class="size-6" aria-hidden="true" /> Informasi Laporan
    </h2>

    <dl class="divide-y divide-sand-dark/60 px-5 text-sm">
      <div :class="rowClass">
        <dt class="flex items-center gap-2.5"><Landmark class="size-5 shrink-0" aria-hidden="true" /> Instansi Penanganan</dt>
        <dd class="col-span-2 font-semibold sm:col-span-1">{{ report.agency?.name ?? 'Belum ditentukan' }}</dd>
      </div>

      <div :class="rowClass">
        <dt class="flex items-center gap-2.5"><LayoutGrid class="size-5 shrink-0" aria-hidden="true" /> Kategori</dt>
        <dd class="col-span-2 font-semibold sm:col-span-1">{{ category }}</dd>
      </div>

      <div v-if="estimate" :class="rowClass">
        <dt class="flex items-center gap-2.5"><Clock class="size-5 shrink-0" aria-hidden="true" /> Estimasi Selesai</dt>
        <dd class="col-span-2 font-semibold sm:col-span-1">{{ estimate }}</dd>
      </div>

      <div v-if="sla" :class="rowClass">
        <dt class="flex items-center gap-2.5"><ShieldCheck class="size-5 shrink-0" aria-hidden="true" /> SLA</dt>
        <dd class="col-span-2 sm:col-span-1">
          <span
            class="inline-flex rounded-full px-3 py-1 text-xs font-bold"
            :class="sla.isOverdue ? 'bg-red-100 text-red-800' : 'bg-lime/50 text-emerald-900'"
          >{{ sla.isOverdue ? 'Terlambat' : 'Tepat Waktu' }}</span>
        </dd>
      </div>
    </dl>
  </section>
</template>