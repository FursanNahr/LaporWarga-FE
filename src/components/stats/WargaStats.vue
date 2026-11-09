<script setup>
import { computed, toRef } from 'vue'
import { assetUrl } from '@/api'
import { statsApi } from '@/api/stats.api'
import { useStatsData } from '@/composables/useStatsData'
import { formatNumber } from '@/utils/formatStats'
import BaseLoading from '@/components/common/BaseLoading.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import StatTile from '@/components/stats/StatTile.vue'

const props = defineProps({ params: { type: Object, required: true } })
const { data, loading, error, reload } = useStatsData(statsApi.citizens, toRef(props, 'params'))

const tiles = computed(() => {
  const s = data.value.summary
  return [
    { label: 'Warga aktif', value: formatNumber(s.activeCitizens) },
    { label: 'Laporan masuk', value: formatNumber(s.reports) },
    { label: 'Laporan pernah disanggah', value: formatNumber(s.disputed) },
    { label: 'Dukungan (upvote)', value: formatNumber(s.upvotes) },
    { label: 'Verifikasi dari warga', value: formatNumber(s.verifications) },
    { label: 'Komentar', value: formatNumber(s.comments) },
    { label: 'Dikonfirmasi "Sudah beres"', value: formatNumber(s.confirmedDone) },
    { label: 'Dikonfirmasi "Belum beres"', value: formatNumber(s.confirmedNotDone) },
  ]
})

const columns = [
  { key: 'rank', label: '#' },
  { key: 'name', label: 'Warga' },
  { key: 'points', label: 'Poin', align: 'right' },
  { key: 'streak', label: 'Streak (hari)', align: 'right' },
  { key: 'reports', label: 'Laporan', align: 'right' },
  { key: 'resolved', label: 'Selesai', align: 'right' },
  { key: 'disputed', label: 'Disanggah', align: 'right' },
  { key: 'supports', label: 'Dukungan', align: 'right' },
  { key: 'comments', label: 'Komentar', align: 'right' },
]
</script>

<template>
  <BaseLoading v-if="loading && !data" text="Memuat statistik warga..." />

  <div v-else-if="error && !data" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
    {{ error }}
    <button type="button" class="ml-2 font-bold underline" @click="reload">Coba lagi</button>
  </div>

  <div v-else-if="data" class="space-y-8" :aria-busy="loading">
    <ul class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <li v-for="tile in tiles" :key="tile.label"><StatTile v-bind="tile" /></li>
    </ul>

    <section aria-labelledby="h-warga-peringkat" class="space-y-3">
      <div>
        <h2 id="h-warga-peringkat" class="text-xl font-extrabold">Kontributor teratas</h2>
        <p class="text-sm opacity-70">
          Poin dan streak dihitung sepanjang waktu, angka lainnya mengikuti periode yang dipilih. Laporan dan komentar
          di laporan anonim tidak dihitung ke siapa pun.
        </p>
      </div>

      <BaseTable v-if="data.leaders.length" :columns="columns" :rows="data.leaders" caption="Kontributor teratas">
        <template #cell-name="{ row }">
          <span class="flex flex-wrap items-center gap-2">
            <img
              v-if="row.avatarUrl"
              :src="assetUrl(row.avatarUrl)"
              alt=""
              class="size-7 rounded-full object-cover"
              loading="lazy"
            />
            <span class="font-semibold">{{ row.name }}</span>
            <span
              v-for="badge in row.badges"
              :key="badge.code"
              class="rounded-full bg-sand px-2 py-0.5 text-[11px] font-semibold"
            >
              {{ badge.name }}
            </span>
          </span>
        </template>
        <template #cell-points="{ value }">{{ formatNumber(value) }}</template>
      </BaseTable>
      <p v-else class="text-sm opacity-70">Belum ada kontributor aktif.</p>
    </section>
  </div>
</template>