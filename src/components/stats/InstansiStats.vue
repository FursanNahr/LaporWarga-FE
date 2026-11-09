<script setup>
import { computed, toRef } from 'vue'
import { statsApi } from '@/api/stats.api'
import { useStatsData } from '@/composables/useStatsData'
import { formatDays, formatNumber, formatPercent } from '@/utils/formatStats'
import BaseLoading from '@/components/common/BaseLoading.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import StatTile from '@/components/stats/StatTile.vue'

const props = defineProps({ params: { type: Object, required: true } })
const { data, loading, error, reload } = useStatsData(statsApi.agencies, toRef(props, 'params'))

const tiles = computed(() => {
  const s = data.value.summary
  return [
    { label: 'Laporan diteruskan ke instansi', value: formatNumber(s.totalReports) },
    { label: 'Selesai', value: formatPercent(s.resolvedPercent), hint: `${formatNumber(s.resolved)} laporan` },
    {
      label: 'Selesai tepat waktu',
      value: formatPercent(s.onTimePercent),
      hint: `Batas ${data.value.slaWindowDays} hari sejak diteruskan`,
    },
    { label: 'Rata-rata penanganan', value: formatDays(s.avgDays), hint: 'Sejak diteruskan sampai selesai' },
    { label: 'Sedang melewati SLA', value: formatNumber(s.overdue), alert: s.overdue > 0 },
    { label: 'Pernah disanggah pelapor', value: formatNumber(s.disputed) },
  ]
})

const agencyColumns = [
  { key: 'name', label: 'Instansi' },
  { key: 'total', label: 'Laporan', align: 'right' },
  { key: 'resolved', label: 'Selesai', align: 'right' },
  { key: 'resolvedPercent', label: '% selesai', align: 'right' },
  { key: 'onTimePercent', label: '% tepat waktu', align: 'right' },
  { key: 'avgDays', label: 'Rata-rata', align: 'right' },
  { key: 'overdue', label: 'Melewati SLA', align: 'right' },
  { key: 'disputed', label: 'Disanggah', align: 'right' },
]

const staffColumns = [
  { key: 'name', label: 'Petugas' },
  { key: 'agency', label: 'Instansi' },
  { key: 'updates', label: 'Pembaruan', align: 'right' },
  { key: 'resolved', label: 'Laporan diselesaikan', align: 'right' },
]
</script>

<template>
  <BaseLoading v-if="loading && !data" text="Memuat statistik instansi..." />

  <div v-else-if="error && !data" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
    {{ error }}
    <button type="button" class="ml-2 font-bold underline" @click="reload">Coba lagi</button>
  </div>

  <div v-else-if="data" class="space-y-8" :aria-busy="loading">
    <ul class="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <li v-for="tile in tiles" :key="tile.label"><StatTile v-bind="tile" /></li>
    </ul>

    <section aria-labelledby="h-instansi-kinerja" class="space-y-3">
      <div>
        <h2 id="h-instansi-kinerja" class="text-xl font-extrabold">Kinerja per instansi</h2>
        <p class="text-sm opacity-70">
          Mencakup laporan yang masuk pada periode terpilih. Waktu penanganan dihitung sejak laporan diteruskan,
          jadi waktu verifikasi admin tidak membebani instansi.
        </p>
      </div>

      <BaseTable v-if="data.agencies.length" :columns="agencyColumns" :rows="data.agencies" caption="Kinerja per instansi">
        <template #cell-name="{ row }">
          {{ row.name }} <span v-if="!row.isActive" class="text-xs opacity-60">(nonaktif)</span>
        </template>
        <template #cell-resolvedPercent="{ value }">{{ formatPercent(value) }}</template>
        <template #cell-onTimePercent="{ value }">{{ formatPercent(value) }}</template>
        <template #cell-avgDays="{ value }">{{ formatDays(value) }}</template>
        <template #cell-overdue="{ value }">
          <span :class="value > 0 ? 'font-bold text-red-700' : ''">{{ value }}</span>
        </template>
      </BaseTable>
      <p v-else class="text-sm opacity-70">Belum ada laporan yang diteruskan ke instansi pada periode ini.</p>
    </section>

    <section aria-labelledby="h-instansi-petugas" class="space-y-3">
      <div>
        <h2 id="h-instansi-petugas" class="text-xl font-extrabold">Petugas paling aktif</h2>
        <p class="text-sm opacity-70">Berdasarkan jumlah pembaruan progres yang dicatat pada periode terpilih.</p>
      </div>

      <BaseTable v-if="data.staff.length" :columns="staffColumns" :rows="data.staff" caption="Petugas paling aktif">
        <template #cell-name="{ row }">
          {{ row.name }} <span v-if="row.isAgencyHead" class="text-xs opacity-60">(atasan)</span>
        </template>
        <template #cell-agency="{ value }">{{ value?.name ?? '-' }}</template>
      </BaseTable>
      <p v-else class="text-sm opacity-70">Belum ada pembaruan dari petugas pada periode ini.</p>
    </section>
  </div>
</template>