<script setup>
import { adminApi } from '@/api/admin.api'
import { useFilteredList } from '@/composables/useFilteredList'
import { REPORT_STATUS } from '@/constants/status'
import { formatAge } from '@/utils/formatDate'
import BaseEmptyState from '@/components/common/BaseEmptyState.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import SlaTag from '@/components/admin/SlaTag.vue'

// Dua antrean: belum diperiksa, dan sudah valid tapi belum diteruskan ke instansi.
const TABS = [
  { status: REPORT_STATUS.MENUNGGU_VERIFIKASI, label: 'Menunggu verifikasi' },
  { status: REPORT_STATUS.TERVERIFIKASI, label: 'Belum diteruskan' },
]

// Antrean: yang paling lama menunggu ada di atas.
const fetchQueue = (params) => adminApi.listLaporan({ ...params, order: 'asc' })

const { filters, items, loading, loadingMore, error, hasMore, loadMore, keywordTooShort } = useFilteredList(
  fetchQueue,
  { initial: { status: TABS[0].status, q: '' }, limit: 15 },
)

const columns = [
  { key: 'trackingCode', label: 'Kode' },
  { key: 'description', label: 'Laporan' },
  { key: 'reporter', label: 'Pelapor' },
  { key: 'agency', label: 'Instansi' },
  { key: 'createdAt', label: 'Menunggu' },
  { key: 'sla', label: 'Batas SLA' },
]
</script>

<template>
  <section class="container admin-page">
    <header class="page-header">
      <div>
        <h1>Verifikasi laporan</h1>
        <p>Periksa laporan masuk, lalu verifikasi, tolak dengan alasan, atau teruskan ke instansi.</p>
      </div>
    </header>

    <div class="tabs" role="group" aria-label="Antrean">
      <button
        v-for="tab in TABS"
        :key="tab.status"
        type="button"
        class="tabs__tab"
        :class="{ 'is-active': filters.status === tab.status }"
        :aria-pressed="filters.status === tab.status"
        @click="filters.status = tab.status"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="filters">
      <div class="filters__field filters__field--grow">
        <label for="q">Cari laporan</label>
        <input id="q" v-model="filters.q" class="control" type="search" placeholder="Kode, kata kunci, alamat, atau nama pelapor" />
        <small v-if="keywordTooShort" class="hint">Kata kunci minimal 2 karakter.</small>
      </div>
    </div>

    <p v-if="error" class="alert alert--error" role="alert">{{ error }}</p>
    <BaseLoading v-if="loading" text="Memuat antrean..." />
    <BaseEmptyState
      v-else-if="!items.length && !error"
      title="Antrean kosong"
      description="Tidak ada laporan yang perlu ditinjau di tab ini."
    />

    <BaseTable v-else :columns="columns" :rows="items" actions-label="Aksi" caption="Antrean verifikasi">
      <template #cell-trackingCode="{ row }">
        <RouterLink :to="{ name: 'admin-detail-laporan', params: { id: row.id } }" class="link">{{ row.trackingCode }}</RouterLink>
      </template>
      <template #cell-description="{ row }">
        <strong v-if="row.subcategory">{{ row.subcategory.name }}</strong>
        <span class="clamp">{{ row.description }}</span>
      </template>
      <template #cell-reporter="{ row }">
        {{ row.reporter.name }} <span v-if="row.isAnonymous" class="tag tag--warn">Anonim</span>
        <br /><span class="muted">{{ row.reporter.email }}</span>
      </template>
      <template #cell-agency="{ value }">{{ value?.name ?? 'Belum ditentukan' }}</template>
      <template #cell-createdAt="{ value }">{{ formatAge(value) }}</template>
      <template #cell-sla="{ row }"><SlaTag :sla="row.sla" /></template>
      <template #actions="{ row }">
        <RouterLink :to="{ name: 'admin-detail-laporan', params: { id: row.id } }" class="btn btn-primary btn--sm">Tinjau</RouterLink>
      </template>
    </BaseTable>

    <BasePagination :has-more="hasMore" :loading="loadingMore" @load-more="loadMore" />
  </section>
</template>

<style scoped>
.link { color: var(--color-primary); text-decoration: underline; white-space: nowrap; }
</style>