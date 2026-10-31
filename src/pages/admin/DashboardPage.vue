<script setup>
import { computed, onMounted, ref } from 'vue'
import { adminApi } from '@/api/admin.api'
import { REPORT_STATUS } from '@/constants/status'
import { statusLabel } from '@/utils/formatStatus'
import BaseLoading from '@/components/common/BaseLoading.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import StatusBadge from '@/components/laporan/StatusBadge.vue'

const data = ref(null)
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data: body } = await adminApi.dashboard()
    data.value = body.data
  } catch (e) {
    error.value = e.normalized?.message ?? 'Gagal memuat dashboard.'
  } finally {
    loading.value = false
  }
}
onMounted(load)

// Kartu angka. `to` = tujuan saat diklik (opsional).
const stats = computed(() => {
  const t = data.value.totals
  return [
    { label: 'Total laporan', value: t.reports, to: { name: 'admin-kelola-laporan' } },
    { label: 'Laporan bulan ini', value: t.thisMonth },
    { label: 'Menunggu verifikasi', value: t.pendingVerification, to: { name: 'admin-verifikasi-laporan' } },
    { label: 'Selesai', value: t.resolved },
    {
      label: 'Melewati SLA',
      value: t.overdue,
      alert: t.overdue > 0,
      to: { name: 'admin-kelola-laporan', query: { isOverdue: 'true' } },
    },
    { label: 'Pernah disanggah', value: t.disputed },
    { label: 'Rata-rata penanganan', value: t.avgResolutionDays === null ? '-' : `${t.avgResolutionDays} hari` },
  ]
})

const statusRows = computed(() =>
  Object.values(REPORT_STATUS).map((status) => ({ status, count: data.value.byStatus[status] ?? 0 })),
)
const statusMax = computed(() => Math.max(1, ...statusRows.value.map((row) => row.count)))

const trendMax = computed(() => Math.max(1, ...data.value.trend.map((day) => day.count)))
const trendTotal = computed(() => data.value.trend.reduce((sum, day) => sum + day.count, 0))
const barHeight = (count) => `${Math.max(count > 0 ? 6 : 2, Math.round((count / trendMax.value) * 100))}%`

const agencyColumns = [
  { key: 'name', label: 'Instansi' },
  { key: 'total', label: 'Laporan', align: 'right' },
  { key: 'resolved', label: 'Selesai', align: 'right' },
  { key: 'percent', label: '% selesai', align: 'right' },
  { key: 'overdue', label: 'Melewati SLA', align: 'right' },
  { key: 'avgResolutionDays', label: 'Rata-rata (hari)', align: 'right' },
]
const agencyRows = computed(() =>
  data.value.byAgency.map((agency) => ({
    ...agency,
    percent: agency.total ? `${Math.round((agency.resolved / agency.total) * 100)}%` : '-',
  })),
)

const overdueColumns = [
  { key: 'trackingCode', label: 'Kode' },
  { key: 'status', label: 'Tahap' },
  { key: 'agency', label: 'Instansi' },
  { key: 'district', label: 'Kecamatan' },
  { key: 'overdueDays', label: 'Terlewat', align: 'right' },
]
</script>

<template>
  <section class="container admin-page">
    <header class="page-header">
      <div>
        <h1>Dashboard</h1>
        <p>Ringkasan laporan. Laporan duplikat yang sudah digabung tidak dihitung.</p>
      </div>
      <button type="button" class="btn" @click="load">Muat ulang</button>
    </header>

    <BaseLoading v-if="loading && !data" text="Memuat dashboard..." />
    <p v-else-if="error && !data" class="alert alert--error" role="alert">{{ error }}</p>

    <template v-else-if="data">
      <p v-if="error" class="alert alert--error" role="alert">{{ error }}</p>

      <div class="stats">
        <component
          :is="stat.to ? 'RouterLink' : 'div'"
          v-for="stat in stats"
          :key="stat.label"
          :to="stat.to"
          class="stat"
          :class="{ 'stat--alert': stat.alert }"
        >
          <span class="stat__value">{{ stat.value }}</span>
          <span class="stat__label">{{ stat.label }}</span>
        </component>
      </div>

      <div class="grid">
        <section class="panel" aria-labelledby="h-status">
          <h2 id="h-status">Laporan per status</h2>
          <ul class="bars">
            <li v-for="row in statusRows" :key="row.status" class="bars__row">
              <span class="bars__label">{{ statusLabel(row.status) }}</span>
              <span class="bars__track" aria-hidden="true">
                <span class="bars__fill" :style="{ width: `${(row.count / statusMax) * 100}%` }"></span>
              </span>
              <span class="bars__count">{{ row.count }}</span>
            </li>
          </ul>
        </section>

        <section class="panel" aria-labelledby="h-trend">
          <h2 id="h-trend">Laporan masuk, {{ data.trend.length }} hari terakhir</h2>
          <div
            class="trend"
            role="img"
            :aria-label="`Total ${trendTotal} laporan masuk dalam ${data.trend.length} hari terakhir`"
          >
            <span
              v-for="day in data.trend"
              :key="day.date"
              class="trend__bar"
              :style="{ height: barHeight(day.count) }"
              :title="`${day.date}: ${day.count} laporan`"
            ></span>
          </div>
          <p class="hint">{{ data.trend[0].date }} sampai {{ data.trend[data.trend.length - 1].date }}, total {{ trendTotal }} laporan.</p>
        </section>
      </div>

      <h2>Kinerja per instansi</h2>
      <BaseTable v-if="agencyRows.length" :columns="agencyColumns" :rows="agencyRows" caption="Kinerja per instansi">
        <template #cell-name="{ row }">
          {{ row.name }} <span v-if="!row.isActive" class="tag">Nonaktif</span>
        </template>
        <template #cell-overdue="{ value }">
          <span :class="{ 'tag tag--danger': value > 0 }">{{ value }}</span>
        </template>
        <template #cell-avgResolutionDays="{ value }">{{ value ?? '-' }}</template>
      </BaseTable>
      <p v-else class="muted">Belum ada instansi.</p>

      <h2>Laporan melewati SLA</h2>
      <BaseTable v-if="data.overdueReports.length" :columns="overdueColumns" :rows="data.overdueReports" caption="Laporan melewati SLA">
        <template #cell-trackingCode="{ row }">
          <RouterLink :to="{ name: 'admin-detail-laporan', params: { id: row.id } }" class="link">{{ row.trackingCode }}</RouterLink>
        </template>
        <template #cell-status="{ value }"><StatusBadge :status="value" /></template>
        <template #cell-agency="{ value }">{{ value?.name ?? '-' }}</template>
        <template #cell-district="{ value }">{{ value?.name ?? '-' }}</template>
        <template #cell-overdueDays="{ value }">{{ value === null ? '-' : `${value} hari` }}</template>
      </BaseTable>
      <p v-else class="alert alert--success">Tidak ada laporan yang melewati SLA.</p>

      <h2>Kecamatan dengan laporan terbanyak</h2>
      <ol v-if="data.byDistrict.length" class="districts">
        <li v-for="district in data.byDistrict" :key="district.id">
          <span>{{ district.name }}</span><strong>{{ district.total }}</strong>
        </li>
      </ol>
      <p v-else class="muted">Belum ada data kecamatan.</p>
    </template>
  </section>
</template>

<style scoped>
.grid { display: grid; gap: 1.25rem; grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr)); }
.link { color: var(--color-primary); text-decoration: underline; }

.bars { display: grid; gap: 0.5rem; margin: 0; padding: 0; list-style: none; }
.bars__row { display: grid; grid-template-columns: 9rem 1fr 3rem; align-items: center; gap: 0.75rem; }
.bars__track { height: 0.75rem; border-radius: 999px; background: var(--color-bg-soft); overflow: hidden; }
.bars__fill { display: block; height: 100%; border-radius: 999px; background: var(--color-primary); }
.bars__count { text-align: right; font-variant-numeric: tabular-nums; }

.trend { display: flex; align-items: flex-end; gap: 2px; height: 8rem; }
.trend__bar { flex: 1; min-width: 2px; border-radius: 2px 2px 0 0; background: var(--color-primary); }

.districts { display: grid; gap: 0.375rem; max-width: 24rem; margin: 0 0 1.25rem; padding-left: 1.25rem; }
.districts li span { display: inline-block; min-width: 12rem; }
</style>