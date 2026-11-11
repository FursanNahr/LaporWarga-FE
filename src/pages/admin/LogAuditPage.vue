<script setup>
import { computed, onMounted, ref } from 'vue'
import { RotateCcw } from 'lucide-vue-next'
import { adminApi } from '@/api/admin.api'
import { useFilteredList } from '@/composables/useFilteredList'
import { formatDateTime } from '@/utils/formatDate'
import { humanizeEnum } from '@/utils/formatStatus'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseEmptyState from '@/components/common/BaseEmptyState.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import BasePagination from '@/components/common/BasePagination.vue'

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

// Warna badge aksi: hapus/sembunyikan merah, buat lime, ubah biru, lainnya netral.
const actionTone = (action) => {
  if (/DELETED$|_HIDDEN$/.test(action)) return 'bg-red-100 text-red-800'
  if (/CREATED$|UNHIDDEN$/.test(action)) return 'bg-lime text-maroon-dark'
  if (/UPDATED$|CHANGED$|ADDED$|MERGED$/.test(action)) return 'bg-sky-100 text-sky-900'
  return 'bg-white text-maroon'
}

const ROLE_VARIANT = { ADMIN: 'warning', INSTANSI: 'info', WARGA: 'primary' }

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

const alertClass = 'rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-sm font-semibold text-red-800'
const controlClass =
  'h-11 w-full cursor-pointer rounded-full border border-sand-dark bg-white/70 px-4 text-sm text-maroon focus:border-maroon focus:outline-none'
const labelClass = 'mb-1 block pl-3 text-xs font-semibold text-maroon/70'
</script>

<template>
  <section class="mx-auto w-full max-w-[1400px] px-5 py-8 lg:px-8">
    <header>
      <h1 class="text-4xl font-extrabold tracking-tight text-maroon sm:text-5xl">
        <span class="relative inline-block">
          Log
          <svg
            class="absolute -bottom-1.5 left-0 h-2.5 w-full"
            viewBox="0 0 200 12"
            preserveAspectRatio="none"
            fill="none"
            aria-hidden="true"
          >
            <path d="M2 8C45 2 120 2 198 7" stroke="#c1f52f" stroke-width="4" stroke-linecap="round" />
          </svg>
        </span>
        audit
      </h1>
      <p class="mt-3 max-w-2xl text-lg text-maroon/80">
        Siapa mengubah apa dan kapan. Log hanya bisa ditambah oleh sistem, tidak bisa diubah atau dihapus.
      </p>
    </header>

    <!-- Filter -->
    <form class="mt-8 grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end" role="search" @submit.prevent>
      <div v-if="actions.length" class="lg:w-60">
        <label for="audit-action" :class="labelClass">Aksi</label>
        <select id="audit-action" v-model="filters.action" :class="controlClass">
          <option value="">Semua aksi</option>
          <option v-for="action in actions" :key="action" :value="action">{{ actionLabel(action) }}</option>
        </select>
      </div>
      <div class="lg:w-48">
        <label for="audit-entity" :class="labelClass">Objek</label>
        <select id="audit-entity" v-model="filters.entityType" :class="controlClass">
          <option value="">Semua objek</option>
          <option v-for="(label, key) in ENTITY_LABEL" :key="key" :value="key">{{ label }}</option>
        </select>
      </div>
      <div class="lg:w-44">
        <label for="audit-from" :class="labelClass">Dari tanggal</label>
        <input id="audit-from" v-model="filters.dateFrom" :class="controlClass" type="date" />
      </div>
      <div class="lg:w-44">
        <label for="audit-to" :class="labelClass">Sampai tanggal</label>
        <input id="audit-to" v-model="filters.dateTo" :class="controlClass" type="date" />
      </div>
      <button
        v-if="hasFilter"
        type="button"
        class="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-maroon px-5 text-sm font-bold text-maroon transition-colors hover:bg-maroon hover:text-white"
        @click="reset"
      >
        <RotateCcw class="size-4" aria-hidden="true" /> Atur ulang
      </button>
    </form>
    <p v-if="dateRangeInvalid" :class="[alertClass, 'mt-4']" role="alert">Tanggal awal tidak boleh setelah tanggal akhir.</p>

    <p v-if="error" :class="[alertClass, 'mt-6']" role="alert">{{ error }}</p>
    <BaseLoading v-if="loading" class="mt-10" text="Memuat log audit..." />
    <BaseEmptyState
      v-else-if="!items.length && !error"
      class="mt-10"
      :title="hasFilter ? 'Tidak ada catatan yang cocok' : 'Belum ada catatan audit'"
    />

    <!-- Tabel -->
    <div v-else class="mt-6 overflow-hidden rounded-2xl border border-sand-dark bg-sand">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[58rem] border-collapse text-left text-sm">
          <caption class="sr-only">Log audit</caption>
          <thead>
            <tr class="bg-maroon text-white">
              <th v-for="column in columns" :key="column.key" scope="col" class="px-4 py-3.5 text-xs font-bold uppercase tracking-wider">
                {{ column.label }}
              </th>
            </tr>
          </thead>
          <tbody class="text-maroon">
            <tr v-for="row in items" :key="row.id" class="border-t border-sand-dark/60 odd:bg-white/80 even:bg-sand">
              <td class="whitespace-nowrap px-4 py-4 align-top font-semibold text-maroon/80">{{ formatDateTime(row.createdAt) }}</td>

              <td class="px-4 py-4 align-top">
                <p class="font-bold leading-tight">{{ row.actor.name }}</p>
                <BaseBadge :variant="ROLE_VARIANT[row.actor.role] ?? 'neutral'" class="mt-1.5">{{ humanizeEnum(row.actor.role) }}</BaseBadge>
              </td>

              <td class="px-4 py-4 align-top">
                <span class="inline-flex rounded-full px-3 py-1 text-xs font-bold" :class="actionTone(row.action)">
                  {{ actionLabel(row.action) }}
                </span>
              </td>

              <td class="px-4 py-4 align-top">
                <RouterLink
                  v-if="row.entityType === 'Report' && row.entityId"
                  :to="{ name: 'admin-detail-laporan', params: { id: row.entityId } }"
                  class="inline-flex whitespace-nowrap rounded-lg bg-white px-2.5 py-1 text-xs font-extrabold tracking-wide text-maroon ring-1 ring-sand-dark transition-colors hover:bg-lime"
                >
                  {{ row.entityLabel ?? `Laporan #${row.entityId}` }}
                </RouterLink>
                <span v-else class="font-semibold">
                  {{ ENTITY_LABEL[row.entityType] ?? row.entityType }}<template v-if="row.entityId"> #{{ row.entityId }}</template>
                </span>
              </td>

              <td class="px-4 py-4 align-top">
                <details v-if="row.oldValue || row.newValue">
                  <summary
                    class="inline-flex h-9 cursor-pointer list-none items-center rounded-full border-2 border-maroon px-4 text-xs font-bold transition-colors hover:bg-maroon hover:text-white [&::-webkit-details-marker]:hidden"
                  >
                    Lihat perubahan
                  </summary>
                  <div class="mt-3 grid max-w-sm gap-3">
                    <div v-if="row.oldValue" class="rounded-xl border border-red-200 bg-red-50 p-3">
                      <p class="text-xs font-bold uppercase tracking-wider text-red-800">Sebelum</p>
                      <pre class="mt-1.5 max-h-48 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">{{ pretty(row.oldValue) }}</pre>
                    </div>
                    <div v-if="row.newValue" class="rounded-xl border border-lime-dark/40 bg-lime/20 p-3">
                      <p class="text-xs font-bold uppercase tracking-wider text-maroon-dark">Sesudah</p>
                      <pre class="mt-1.5 max-h-48 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">{{ pretty(row.newValue) }}</pre>
                    </div>
                  </div>
                  <p v-if="row.ipAddress" class="mt-2 text-xs text-maroon/70">IP {{ row.ipAddress }}</p>
                </details>
                <span v-else class="text-maroon/50">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <BasePagination :has-more="hasMore" :loading="loadingMore" @load-more="loadMore" />
  </section>
</template>