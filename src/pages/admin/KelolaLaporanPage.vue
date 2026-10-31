<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { adminApi } from '@/api/admin.api'
import { useFilteredList } from '@/composables/useFilteredList'
import { useMasterOptions } from '@/composables/useMasterOptions'
import { useToast } from '@/composables/useToast'
import { ALL_STATUSES } from '@/constants/status'
import { formatDate } from '@/utils/formatDate'
import { statusLabel } from '@/utils/formatStatus'
import BaseEmptyState from '@/components/common/BaseEmptyState.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import BaseTable from '@/components/common/BaseTable.vue'
import StatusBadge from '@/components/laporan/StatusBadge.vue'
import SlaTag from '@/components/admin/SlaTag.vue'

const route = useRoute()
const toast = useToast()
const { agencies, districts, categories } = useMasterOptions()

// Dashboard menaut ke sini dengan ?isOverdue=true, jadi filter awal dibaca dari query.
const initial = {
  q: '',
  status: ALL_STATUSES.includes(route.query.status) ? route.query.status : '',
  agencyId: '',
  districtId: '',
  subcategoryId: '',
  dateFrom: '',
  dateTo: '',
  isOverdue: route.query.isOverdue === 'true',
  merged: false,
}

// "Atur ulang" mengosongkan semua filter, termasuk yang datang dari link dashboard.
const blank = { ...initial, status: '', isOverdue: false }

const { filters, params, items, loading, loadingMore, error, hasMore, loadMore, reset, hasFilter, keywordTooShort } =
  useFilteredList(adminApi.listLaporan, { initial, resetTo: blank, limit: 15 })

const columns = [
  { key: 'trackingCode', label: 'Kode' },
  { key: 'status', label: 'Status' },
  { key: 'subcategory', label: 'Jenis' },
  { key: 'agency', label: 'Instansi' },
  { key: 'district', label: 'Kecamatan' },
  { key: 'reporter', label: 'Pelapor' },
  { key: 'createdAt', label: 'Tanggal' },
  { key: 'sla', label: 'Batas SLA' },
]

// ---- Ekspor CSV ----
const exporting = ref(false)
const dateRangeInvalid = computed(
  () => Boolean(filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo),
)

// Saat ekspor gagal, isi error ada di dalam Blob (bukan JSON biasa), jadi dibaca manual.
async function exportErrorMessage(e) {
  const blob = e.response?.data
  if (blob instanceof Blob) {
    try {
      return JSON.parse(await blob.text()).message ?? 'Gagal mengekspor laporan.'
    } catch {
      /* bukan JSON: pakai pesan bawaan di bawah */
    }
  }
  return e.normalized?.message ?? 'Gagal mengekspor laporan.'
}

async function exportCsv() {
  if (exporting.value) return
  exporting.value = true
  try {
    const response = await adminApi.eksporLaporan(params.value)
    const url = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = `laporan-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    // Header ini hanya terbaca jika BE mengizinkannya lewat CORS (exposedHeaders).
    if (response.headers['x-export-truncated'] === 'true') {
      toast.info('Ekspor dibatasi 10.000 baris pertama. Persempit filter untuk data lainnya.')
    }
  } catch (e) {
    toast.error(await exportErrorMessage(e))
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <section class="container admin-page">
    <header class="page-header">
      <div>
        <h1>Kelola laporan</h1>
        <p>Semua laporan, termasuk yang ditolak dan hasil penggabungan.</p>
      </div>
      <button type="button" class="btn" :aria-busy="exporting" @click="exportCsv">
        {{ exporting ? 'Menyiapkan CSV...' : 'Ekspor CSV' }}
      </button>
    </header>

    <form class="filters" role="search" @submit.prevent>
      <div class="filters__field filters__field--grow">
        <label for="f-q">Cari laporan</label>
        <input id="f-q" v-model="filters.q" class="control" type="search" placeholder="Kode, kata kunci, alamat, atau nama pelapor" />
        <small v-if="keywordTooShort" class="hint">Kata kunci minimal 2 karakter.</small>
      </div>

      <div class="filters__field">
        <label for="f-status">Status</label>
        <select id="f-status" v-model="filters.status" class="control">
          <option value="">Semua status</option>
          <option v-for="status in ALL_STATUSES" :key="status" :value="status">{{ statusLabel(status) }}</option>
        </select>
      </div>

      <div v-if="agencies.length" class="filters__field">
        <label for="f-agency">Instansi</label>
        <select id="f-agency" v-model="filters.agencyId" class="control">
          <option value="">Semua instansi</option>
          <option v-for="agency in agencies" :key="agency.id" :value="agency.id">{{ agency.name }}</option>
        </select>
      </div>

      <div v-if="categories.length" class="filters__field">
        <label for="f-sub">Jenis laporan</label>
        <select id="f-sub" v-model="filters.subcategoryId" class="control">
          <option value="">Semua jenis</option>
          <optgroup v-for="category in categories" :key="category.id" :label="category.name">
            <option v-for="sub in category.subcategories" :key="sub.id" :value="sub.id">{{ sub.name }}</option>
          </optgroup>
        </select>
      </div>

      <div v-if="districts.length" class="filters__field">
        <label for="f-district">Kecamatan</label>
        <select id="f-district" v-model="filters.districtId" class="control">
          <option value="">Semua kecamatan</option>
          <option v-for="district in districts" :key="district.id" :value="district.id">{{ district.name }}</option>
        </select>
      </div>

      <div class="filters__field">
        <label for="f-from">Dari tanggal</label>
        <input id="f-from" v-model="filters.dateFrom" class="control" type="date" />
      </div>
      <div class="filters__field">
        <label for="f-to">Sampai tanggal</label>
        <input id="f-to" v-model="filters.dateTo" class="control" type="date" />
      </div>

      <label class="filters__check"><input v-model="filters.isOverdue" type="checkbox" /> Melewati SLA</label>
      <label class="filters__check"><input v-model="filters.merged" type="checkbox" /> Hanya hasil gabungan</label>
      <button v-if="hasFilter" type="button" class="btn" @click="reset">Atur ulang</button>
    </form>
    <p v-if="dateRangeInvalid" class="alert alert--error" role="alert">Tanggal awal tidak boleh setelah tanggal akhir.</p>

    <p v-if="error" class="alert alert--error" role="alert">{{ error }}</p>
    <BaseLoading v-if="loading" text="Memuat laporan..." />
    <BaseEmptyState
      v-else-if="!items.length && !error"
      :title="hasFilter ? 'Tidak ada laporan yang cocok' : 'Belum ada laporan'"
      :description="hasFilter ? 'Ubah atau atur ulang filter, lalu coba lagi.' : ''"
    />

    <BaseTable v-else :columns="columns" :rows="items" actions-label="Aksi" caption="Daftar semua laporan">
      <template #cell-trackingCode="{ row }">
        <RouterLink :to="{ name: 'admin-detail-laporan', params: { id: row.id } }" class="link">{{ row.trackingCode }}</RouterLink>
        <span v-if="row.mergedIntoId" class="tag"> Digabung</span>
      </template>
      <template #cell-status="{ value }"><StatusBadge :status="value" /></template>
      <template #cell-subcategory="{ value }">{{ value?.name ?? '-' }}</template>
      <template #cell-agency="{ value }">{{ value?.name ?? '-' }}</template>
      <template #cell-district="{ value }">{{ value?.name ?? '-' }}</template>
      <template #cell-reporter="{ row }">
        {{ row.reporter.name }} <span v-if="row.isAnonymous" class="tag tag--warn">Anonim</span>
      </template>
      <template #cell-createdAt="{ value }">{{ formatDate(value) }}</template>
      <template #cell-sla="{ row }"><SlaTag :sla="row.sla" /></template>
      <template #actions="{ row }">
        <RouterLink :to="{ name: 'admin-detail-laporan', params: { id: row.id } }" class="btn btn--sm">Detail</RouterLink>
      </template>
    </BaseTable>

    <BasePagination :has-more="hasMore" :loading="loadingMore" @load-more="loadMore" />
  </section>
</template>

<style scoped>
.link { color: var(--color-primary); text-decoration: underline; white-space: nowrap; }
</style>