<script setup>
import { computed, onMounted, ref } from 'vue'
import { adminApi } from '@/api/admin.api'
import { useFilteredList } from '@/composables/useFilteredList'
import { formatDateTime } from '@/utils/formatDate'
import { humanizeEnum } from '@/utils/formatStatus'
import BaseEmptyState from '@/components/common/BaseEmptyState.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import BaseTable from '@/components/common/BaseTable.vue'

// Nama aksi dari BE (AUDIT_ACTIONS). Aksi baru yang belum ada di sini tampil dalam bentuk huruf kapital awal kata.
const ACTION_LABEL = {
  REPORT_STATUS_CHANGED: 'Status laporan berubah',
  REPORT_PROGRESS_ADDED: 'Catatan progres ditambahkan',
  REPORT_MERGED: 'Laporan digabung',
  REPORTS_EXPORTED: 'Laporan diekspor',
  COMMENT_HIDDEN: 'Komentar disembunyikan',
  COMMENT_UNHIDDEN: 'Komentar ditampilkan kembali',
  SLA_SETTINGS_UPDATED: 'Pengaturan SLA diubah',
  AGENCY_CREATED: 'Instansi dibuat',
  AGENCY_UPDATED: 'Instansi diubah',
  STAFF_CREATED: 'Akun petugas dibuat',
  STAFF_UPDATED: 'Akun petugas diubah',
  CATEGORY_CREATED: 'Kategori dibuat',
  CATEGORY_UPDATED: 'Kategori diubah',
  CATEGORY_DELETED: 'Kategori dihapus',
  SUBCATEGORY_CREATED: 'Subjenis dibuat',
  SUBCATEGORY_UPDATED: 'Subjenis diubah',
  SUBCATEGORY_DELETED: 'Subjenis dihapus',
}
const actionLabel = (action) => ACTION_LABEL[action] ?? humanizeEnum(action)

const ENTITY_LABEL = {
  Report: 'Laporan',
  Comment: 'Komentar',
  Agency: 'Instansi',
  User: 'Akun',
  Category: 'Kategori',
  Subcategory: 'Subjenis',
  SlaSetting: 'Pengaturan SLA',
}

const actions = ref([])
onMounted(async () => {
  try {
    const { data: body } = await adminApi.aksiAudit()
    actions.value = body.data
  } catch {
    /* dropdown aksi disembunyikan */
  }
})

const { filters, items, loading, loadingMore, error, hasMore, loadMore, reset, hasFilter } = useFilteredList(
  adminApi.logAudit,
  { initial: { action: '', entityType: '', dateFrom: '', dateTo: '' }, limit: 20, debounced: [] },
)

const dateRangeInvalid = computed(
  () => Boolean(filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo),
)

const columns = [
  { key: 'createdAt', label: 'Waktu' },
  { key: 'actor', label: 'Pelaku' },
  { key: 'action', label: 'Aksi' },
  { key: 'entityType', label: 'Objek' },
  { key: 'detail', label: 'Perubahan' },
]

const pretty = (value) => JSON.stringify(value, null, 2)
</script>

<template>
  <section class="container admin-page">
    <header class="page-header">
      <div>
        <h1>Log audit</h1>
        <p>Siapa mengubah apa dan kapan. Log hanya bisa ditambah oleh sistem, tidak bisa diubah atau dihapus.</p>
      </div>
    </header>

    <form class="filters" role="search" @submit.prevent>
      <div v-if="actions.length" class="filters__field">
        <label for="audit-action">Aksi</label>
        <select id="audit-action" v-model="filters.action" class="control">
          <option value="">Semua aksi</option>
          <option v-for="action in actions" :key="action" :value="action">{{ actionLabel(action) }}</option>
        </select>
      </div>
      <div class="filters__field">
        <label for="audit-entity">Objek</label>
        <select id="audit-entity" v-model="filters.entityType" class="control">
          <option value="">Semua objek</option>
          <option v-for="(label, key) in ENTITY_LABEL" :key="key" :value="key">{{ label }}</option>
        </select>
      </div>
      <div class="filters__field">
        <label for="audit-from">Dari tanggal</label>
        <input id="audit-from" v-model="filters.dateFrom" class="control" type="date" />
      </div>
      <div class="filters__field">
        <label for="audit-to">Sampai tanggal</label>
        <input id="audit-to" v-model="filters.dateTo" class="control" type="date" />
      </div>
      <button v-if="hasFilter" type="button" class="btn" @click="reset">Atur ulang</button>
    </form>
    <p v-if="dateRangeInvalid" class="alert alert--error" role="alert">Tanggal awal tidak boleh setelah tanggal akhir.</p>

    <p v-if="error" class="alert alert--error" role="alert">{{ error }}</p>
    <BaseLoading v-if="loading" text="Memuat log audit..." />
    <BaseEmptyState v-else-if="!items.length && !error" :title="hasFilter ? 'Tidak ada catatan yang cocok' : 'Belum ada catatan audit'" />

    <BaseTable v-else :columns="columns" :rows="items" caption="Log audit">
      <template #cell-createdAt="{ value }"><span class="nowrap">{{ formatDateTime(value) }}</span></template>
      <template #cell-actor="{ value }">
        {{ value.name }} <span class="tag">{{ humanizeEnum(value.role) }}</span>
      </template>
      <template #cell-action="{ value }">{{ actionLabel(value) }}</template>
      <template #cell-entityType="{ row }">
        <RouterLink
          v-if="row.entityType === 'Report' && row.entityId"
          :to="{ name: 'admin-detail-laporan', params: { id: row.entityId } }"
          class="link"
        >
          {{ row.entityLabel ?? `Laporan #${row.entityId}` }}
        </RouterLink>
        <template v-else>
          {{ ENTITY_LABEL[row.entityType] ?? row.entityType }}<template v-if="row.entityId"> #{{ row.entityId }}</template>
        </template>
      </template>
      <template #cell-detail="{ row }">
        <details v-if="row.oldValue || row.newValue">
          <summary>Lihat perubahan</summary>
          <div class="diff">
            <div v-if="row.oldValue"><strong>Sebelum</strong><pre class="mono">{{ pretty(row.oldValue) }}</pre></div>
            <div v-if="row.newValue"><strong>Sesudah</strong><pre class="mono">{{ pretty(row.newValue) }}</pre></div>
          </div>
          <small v-if="row.ipAddress" class="muted">IP {{ row.ipAddress }}</small>
        </details>
        <span v-else class="muted">-</span>
      </template>
    </BaseTable>

    <BasePagination :has-more="hasMore" :loading="loadingMore" @load-more="loadMore" />
  </section>
</template>

<style scoped>
.nowrap { white-space: nowrap; }
.link { color: var(--color-primary); text-decoration: underline; white-space: nowrap; }
summary { cursor: pointer; color: var(--color-primary); }
.diff { display: grid; gap: 0.5rem; margin-top: 0.5rem; }
.diff pre { max-width: 24rem; margin: 0.25rem 0 0; padding: 0.5rem; overflow-x: auto; border-radius: var(--radius); background: var(--color-bg-soft); }
</style>