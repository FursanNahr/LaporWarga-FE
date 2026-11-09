<script setup>
import { computed, toRef } from 'vue'
import { statsApi } from '@/api/stats.api'
import { useStatsData } from '@/composables/useStatsData'
import { formatHours, formatNumber, formatPercent } from '@/utils/formatStats'
import BaseLoading from '@/components/common/BaseLoading.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import StatTile from '@/components/stats/StatTile.vue'

const props = defineProps({ params: { type: Object, required: true } })
const { data, loading, error, reload } = useStatsData(statsApi.admins, toRef(props, 'params'))

const tiles = computed(() => {
  const s = data.value.summary
  return [
    {
      label: 'Menunggu verifikasi saat ini',
      value: formatNumber(s.pending),
      hint: s.pendingOverdue ? `${s.pendingOverdue} melewati batas ${s.verificationSlaDays} hari` : '',
      alert: s.pendingOverdue > 0,
    },
    { label: 'Rata-rata waktu verifikasi', value: formatHours(s.avgVerificationHours) },
    {
      label: 'Verifikasi dalam batas SLA',
      value: formatPercent(s.withinSlaPercent),
      hint: `Batas ${s.verificationSlaDays} hari`,
    },
    { label: 'Dinyatakan valid', value: formatNumber(s.valid) },
    { label: 'Ditolak', value: formatNumber(s.rejected) },
    { label: 'Diteruskan ke instansi', value: formatNumber(s.forwarded) },
    { label: 'Laporan duplikat digabung', value: formatNumber(s.merged) },
    { label: 'Komentar disembunyikan', value: formatNumber(s.hidden) },
  ]
})

const columns = [
  { key: 'name', label: 'Admin' },
  { key: 'decisions', label: 'Keputusan', align: 'right' },
  { key: 'valid', label: 'Valid', align: 'right' },
  { key: 'rejected', label: 'Ditolak', align: 'right' },
  { key: 'forwarded', label: 'Diteruskan', align: 'right' },
  { key: 'avgVerificationHours', label: 'Rata-rata verifikasi', align: 'right' },
  { key: 'merged', label: 'Digabung', align: 'right' },
  { key: 'hidden', label: 'Disembunyikan', align: 'right' },
  { key: 'actions', label: 'Aktivitas tercatat', align: 'right' },
]
</script>

<template>
  <BaseLoading v-if="loading && !data" text="Memuat statistik admin..." />

  <div v-else-if="error && !data" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
    {{ error }}
    <button type="button" class="ml-2 font-bold underline" @click="reload">Coba lagi</button>
  </div>

  <div v-else-if="data" class="space-y-8" :aria-busy="loading">
    <ul class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <li v-for="tile in tiles" :key="tile.label"><StatTile v-bind="tile" /></li>
    </ul>

    <section aria-labelledby="h-admin-aktivitas" class="space-y-3">
      <div>
        <h2 id="h-admin-aktivitas" class="text-xl font-extrabold">Aktivitas per admin</h2>
        <p class="text-sm opacity-70">
          Keputusan dihitung dari riwayat status laporan, dan aktivitas tercatat dari log audit. Waktu verifikasi
          dihitung sejak laporan dibuat sampai admin menyatakan valid atau menolak.
        </p>
      </div>

      <BaseTable v-if="data.admins.length" :columns="columns" :rows="data.admins" caption="Aktivitas per admin">
        <template #cell-name="{ row }">
          {{ row.name }} <span v-if="!row.isActive" class="text-xs opacity-60">(nonaktif)</span>
        </template>
        <template #cell-avgVerificationHours="{ value }">{{ formatHours(value) }}</template>
      </BaseTable>
      <p v-else class="text-sm opacity-70">Belum ada aktivitas admin pada periode ini.</p>
    </section>
  </div>
</template>