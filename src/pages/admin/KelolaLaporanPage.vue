<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronDown, Copy, Download, EllipsisVertical, ExternalLink, Eye, FileText, Search } from 'lucide-vue-next'
import { adminApi } from '@/api/admin.api'
import { useFilteredList } from '@/composables/useFilteredList'
import { useMasterOptions } from '@/composables/useMasterOptions'
import { useToast } from '@/composables/useToast'
import { ALL_STATUSES } from '@/constants/status'
import { formatDateTime } from '@/utils/formatDate'
import { statusLabel } from '@/utils/formatStatus'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseEmptyState from '@/components/common/BaseEmptyState.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import StatusBadge from '@/components/laporan/StatusBadge.vue'
import SlaTag from '@/components/admin/SlaTag.vue'

const route = useRoute()
const router = useRouter()
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

// Hanya dipakai untuk header tabel; isi tiap sel ditulis langsung di template.
const columns = [
  { key: 'trackingCode', label: 'Kode' },
  { key: 'status', label: 'Status' },
  { key: 'subcategory', label: 'Jenis' },
  { key: 'reporter', label: 'Pelapor' },
  { key: 'agency', label: 'Instansi' },
  { key: 'district', label: 'Kecamatan' },
  { key: 'createdAt', label: 'Tanggal Lapor' },
  { key: 'sla', label: 'Batas SLA' },
]

// ---- Gaya bersama (Tailwind, token moodboard) ----
const labelClass = 'mb-1.5 block text-sm font-semibold text-maroon'
const controlClass =
  'w-full rounded-full border border-sand-dark bg-cream px-4 py-2.5 text-sm text-maroon placeholder:text-maroon/50 focus:border-maroon focus:outline-none focus:ring-2 focus:ring-lime'
const checkboxClass = 'h-4 w-4 cursor-pointer rounded border-sand-dark accent-maroon'

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

// ---- Pilih baris + ekspor terpilih (dibuat di FE dari baris yang sudah termuat) ----
const selectedIds = ref(new Set())
const selectedRows = computed(() => items.value.filter((row) => selectedIds.value.has(row.id)))
const allSelected = computed(() => items.value.length > 0 && items.value.every((row) => selectedIds.value.has(row.id)))
const someSelected = computed(() => selectedIds.value.size > 0)

function toggleRow(id) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

function toggleAll() {
  selectedIds.value = allSelected.value ? new Set() : new Set(items.value.map((row) => row.id))
}

function clearSelection() {
  selectedIds.value = new Set()
}

// Filter berubah -> daftar dimuat ulang, jadi pilihan lama dilepas.
watch(params, clearSelection)

// Tanda kutip digandakan; awalan = + - @ diberi petik agar tidak dibaca sebagai rumus di Excel.
function csvCell(value) {
  let text = String(value ?? '')
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

function exportSelected() {
  if (!selectedRows.value.length) return
  const header = ['Kode', 'Status', 'Jenis', 'Pelapor', 'Instansi', 'Kecamatan', 'Tanggal Lapor']
  const body = selectedRows.value.map((row) => [
    row.trackingCode,
    statusLabel(row.status),
    row.subcategory?.name,
    row.isAnonymous ? `${row.reporter?.name ?? ''} (Anonim)` : row.reporter?.name,
    row.agency?.name,
    row.district?.name,
    formatDateTime(row.createdAt),
  ])
  const csv = [header, ...body].map((cols) => cols.map(csvCell).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `laporan-terpilih-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// ---- Menu titik tiga per baris ----
// Menu di-teleport ke <body> dengan posisi fixed supaya tidak terpotong oleh tabel yang bisa digeser.
const MENU_WIDTH = 224
const MENU_HEIGHT = 140
const menuRowId = ref(null)
const menuPos = ref({ top: 0, left: 0 })
const menuRow = computed(() => items.value.find((row) => row.id === menuRowId.value) ?? null)

function closeMenu() {
  menuRowId.value = null
}

function toggleMenu(row, event) {
  if (menuRowId.value === row.id) return closeMenu()
  const rect = event.currentTarget.getBoundingClientRect()
  const opensUp = rect.bottom + 4 + MENU_HEIGHT > window.innerHeight
  menuPos.value = {
    top: opensUp ? rect.top - MENU_HEIGHT - 4 : rect.bottom + 4,
    left: Math.max(8, rect.right - MENU_WIDTH),
  }
  menuRowId.value = row.id
}

async function copyCode(row) {
  closeMenu()
  try {
    await navigator.clipboard.writeText(row.trackingCode)
    toast.success(`Kode ${row.trackingCode} disalin.`)
  } catch {
    toast.error('Gagal menyalin kode. Salin manual dari tabel.')
  }
}

function openInNewTab(row) {
  closeMenu()
  const { href } = router.resolve({ name: 'admin-detail-laporan', params: { id: row.id } })
  window.open(href, '_blank', 'noopener')
}

function onDocumentClick(event) {
  if (!event.target.closest('[data-row-menu]')) closeMenu()
}
function onKeydown(event) {
  if (event.key === 'Escape') closeMenu()
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', closeMenu)
  window.addEventListener('scroll', closeMenu, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', closeMenu)
  window.removeEventListener('scroll', closeMenu, true)
})
</script>

<template>
  <section class="mx-auto w-full max-w-[90rem] px-4 py-6 sm:px-6 lg:px-8">
    <!-- Judul + ekspor -->
    <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div class="flex items-start gap-3">
        <FileText class="mt-1 h-9 w-9 shrink-0 text-maroon" aria-hidden="true" />
        <div>
          <h1 class="text-3xl font-extrabold tracking-tight text-maroon">Kelola Laporan</h1>
          <p class="mt-1 text-maroon/70">Kelola laporan yang masuk dan atur status penanganannya.</p>
        </div>
      </div>
      <BaseButton variant="secondary" :loading="exporting" :aria-busy="exporting" @click="exportCsv">
        <span class="inline-flex items-center gap-2">
          <Download class="h-4 w-4" aria-hidden="true" />
          {{ exporting ? 'Menyiapkan CSV...' : 'Ekspor CSV' }}
        </span>
      </BaseButton>
    </header>

    <!-- Filter -->
    <form class="rounded-3xl border border-sand-dark bg-sand/60 p-4 sm:p-5" role="search" @submit.prevent>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
        <div class="lg:col-span-4">
          <label for="f-q" :class="labelClass">Cari laporan</label>
          <div class="relative">
            <input
              id="f-q"
              v-model="filters.q"
              type="search"
              placeholder="Kode, kata kunci, alamat, atau nama pelapor"
              :class="[controlClass, 'pr-11 [&::-webkit-search-cancel-button]:hidden']"
            />
            <Search class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-maroon/60" aria-hidden="true" />
          </div>
          <p v-if="keywordTooShort" class="mt-1 text-xs text-maroon/70">Kata kunci minimal 2 karakter.</p>
        </div>

        <div class="lg:col-span-2">
          <label for="f-status" :class="labelClass">Status</label>
          <div class="relative">
            <select id="f-status" v-model="filters.status" :class="[controlClass, 'appearance-none pr-10']">
              <option value="">Semua status</option>
              <option v-for="status in ALL_STATUSES" :key="status" :value="status">{{ statusLabel(status) }}</option>
            </select>
            <ChevronDown class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-maroon/60" aria-hidden="true" />
          </div>
        </div>

        <div v-if="agencies.length" class="lg:col-span-3">
          <label for="f-agency" :class="labelClass">Instansi</label>
          <div class="relative">
            <select id="f-agency" v-model="filters.agencyId" :class="[controlClass, 'appearance-none pr-10']">
              <option value="">Semua instansi</option>
              <option v-for="agency in agencies" :key="agency.id" :value="agency.id">{{ agency.name }}</option>
            </select>
            <ChevronDown class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-maroon/60" aria-hidden="true" />
          </div>
        </div>

        <div v-if="districts.length" class="lg:col-span-3">
          <label for="f-district" :class="labelClass">Kecamatan</label>
          <div class="relative">
            <select id="f-district" v-model="filters.districtId" :class="[controlClass, 'appearance-none pr-10']">
              <option value="">Semua kecamatan</option>
              <option v-for="district in districts" :key="district.id" :value="district.id">{{ district.name }}</option>
            </select>
            <ChevronDown class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-maroon/60" aria-hidden="true" />
          </div>
        </div>

        <div v-if="categories.length" class="lg:col-span-4">
          <label for="f-sub" :class="labelClass">Jenis laporan</label>
          <div class="relative">
            <select id="f-sub" v-model="filters.subcategoryId" :class="[controlClass, 'appearance-none pr-10']">
              <option value="">Semua jenis</option>
              <optgroup v-for="category in categories" :key="category.id" :label="category.name">
                <option v-for="sub in category.subcategories" :key="sub.id" :value="sub.id">{{ sub.name }}</option>
              </optgroup>
            </select>
            <ChevronDown class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-maroon/60" aria-hidden="true" />
          </div>
        </div>

        <div class="sm:col-span-2 lg:col-span-8">
          <span :class="labelClass">Dari - Sampai</span>
          <div class="flex items-center gap-2">
            <input v-model="filters.dateFrom" type="date" aria-label="Dari tanggal" :class="controlClass" />
            <span class="text-maroon/60" aria-hidden="true">-</span>
            <input v-model="filters.dateTo" type="date" aria-label="Sampai tanggal" :class="controlClass" />
          </div>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <label class="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-maroon">
          <input v-model="filters.isOverdue" type="checkbox" :class="checkboxClass" />
          Melewati SLA
        </label>
        <label class="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-maroon">
          <input v-model="filters.merged" type="checkbox" :class="checkboxClass" />
          Hanya hasil gabungan
        </label>
        <BaseButton v-if="hasFilter" variant="secondary" class="ml-auto" @click="reset">Atur ulang</BaseButton>
      </div>
    </form>

    <p v-if="dateRangeInvalid" class="mt-4 rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-800" role="alert">
      Tanggal awal tidak boleh setelah tanggal akhir.
    </p>
    <p v-if="error" class="mt-4 rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-800" role="alert">{{ error }}</p>

    <!-- Bilah aksi saat ada baris terpilih -->
    <div
      v-if="someSelected"
      class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-maroon px-4 py-2.5 text-white"
      role="status"
    >
      <span class="text-sm font-semibold">{{ selectedIds.size }} laporan dipilih</span>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full bg-lime px-4 py-1.5 text-sm font-semibold text-maroon hover:bg-lime-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
          @click="exportSelected"
        >
          <Download class="h-4 w-4" aria-hidden="true" />
          Ekspor terpilih
        </button>
        <button
          type="button"
          class="rounded-full px-3 py-1.5 text-sm font-semibold text-white/90 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
          @click="clearSelection"
        >
          Batal pilih
        </button>
      </div>
    </div>

    <!-- Daftar -->
    <div class="mt-4">
      <BaseLoading v-if="loading" text="Memuat laporan..." />
      <BaseEmptyState
        v-else-if="!items.length && !error"
        :title="hasFilter ? 'Tidak ada laporan yang cocok' : 'Belum ada laporan'"
        :description="hasFilter ? 'Ubah atau atur ulang filter, lalu coba lagi.' : ''"
      />

      <template v-else>
        <div class="overflow-x-auto rounded-3xl border border-sand-dark bg-white/70" role="region" tabindex="0" aria-label="Daftar semua laporan">
          <table class="w-full min-w-[60rem] text-left text-sm text-maroon">
            <caption class="sr-only">Daftar semua laporan</caption>
            <thead class="bg-sand">
              <tr>
                <th scope="col" class="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    :class="checkboxClass"
                    :checked="allSelected"
                    :indeterminate="someSelected && !allSelected"
                    aria-label="Pilih semua laporan yang tampil"
                    @change="toggleAll"
                  />
                </th>
                <th v-for="column in columns" :key="column.key" scope="col" class="whitespace-nowrap px-3 py-3 font-semibold">
                  {{ column.label }}
                </th>
                <th scope="col" class="px-4 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in items"
                :key="row.id"
                class="border-t border-sand-dark align-middle"
                :class="selectedIds.has(row.id) ? 'bg-lime/15' : 'hover:bg-sand/60'"
              >
                <td class="px-4 py-3">
                  <input
                    type="checkbox"
                    :class="checkboxClass"
                    :checked="selectedIds.has(row.id)"
                    :aria-label="`Pilih laporan ${row.trackingCode}`"
                    @change="toggleRow(row.id)"
                  />
                </td>
                <td class="whitespace-nowrap px-3 py-3">
                  <RouterLink
                    :to="{ name: 'admin-detail-laporan', params: { id: row.id } }"
                    class="font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900"
                  >
                    {{ row.trackingCode }}
                  </RouterLink>
                  <span v-if="row.mergedIntoId" class="ml-1.5 rounded-full bg-sand-dark px-2 py-0.5 text-xs font-semibold text-maroon">Digabung</span>
                </td>
                <td class="px-3 py-3"><StatusBadge :status="row.status" /></td>
                <td class="min-w-40 px-3 py-3">{{ row.subcategory?.name ?? '-' }}</td>
                <td class="min-w-32 px-3 py-3">
                  {{ row.reporter?.name ?? '-' }}
                  <span v-if="row.isAnonymous" class="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">Anonim</span>
                </td>
                <td class="min-w-44 px-3 py-3">{{ row.agency?.name ?? '-' }}</td>
                <td class="min-w-32 px-3 py-3">{{ row.district?.name ?? '-' }}</td>
                <td class="whitespace-nowrap px-3 py-3">{{ formatDateTime(row.createdAt) }}</td>
                <td class="whitespace-nowrap px-3 py-3"><SlaTag :sla="row.sla" /></td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-2">
                    <RouterLink
                      :to="{ name: 'admin-detail-laporan', params: { id: row.id } }"
                      class="rounded-full border border-sand-dark bg-white px-4 py-1.5 text-sm font-semibold text-maroon hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
                    >
                      Detail
                    </RouterLink>
                    <button
                      type="button"
                      data-row-menu
                      class="grid h-9 w-9 place-items-center rounded-full border border-sand-dark bg-white text-maroon hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
                      aria-haspopup="menu"
                      :aria-expanded="menuRowId === row.id"
                      :aria-label="`Menu aksi laporan ${row.trackingCode}`"
                      @click="toggleMenu(row, $event)"
                    >
                      <EllipsisVertical class="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm text-maroon/80">
            Menampilkan {{ items.length }} laporan<span v-if="hasMore">, masih ada yang belum dimuat</span>
          </p>
          <BasePagination :has-more="hasMore" :loading="loadingMore" @load-more="loadMore" />
        </div>
      </template>
    </div>

    <!-- Menu titik tiga (di-teleport agar tidak terpotong tabel) -->
    <Teleport to="body">
      <div
        v-if="menuRow"
        data-row-menu
        role="menu"
        class="fixed z-50 w-56 rounded-2xl border border-sand-dark bg-cream p-1.5 shadow-lg"
        :style="{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }"
      >
        <RouterLink
          :to="{ name: 'admin-detail-laporan', params: { id: menuRow.id } }"
          role="menuitem"
          class="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-maroon hover:bg-sand"
          @click="closeMenu"
        >
          <Eye class="h-4 w-4" aria-hidden="true" /> Lihat detail
        </RouterLink>
        <button
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-maroon hover:bg-sand"
          @click="copyCode(menuRow)"
        >
          <Copy class="h-4 w-4" aria-hidden="true" /> Salin kode tracking
        </button>
        <button
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-maroon hover:bg-sand"
          @click="openInNewTab(menuRow)"
        >
          <ExternalLink class="h-4 w-4" aria-hidden="true" /> Buka di tab baru
        </button>
      </div>
    </Teleport>
  </section>
</template>