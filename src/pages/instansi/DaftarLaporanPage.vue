<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ChevronDown, CircleCheck, Clock, FileText, Search, Send, X } from 'lucide-vue-next'
import { instansiApi } from '@/api/instansi.api'
import { masterApi } from '@/api/master.api'
import { usePagination } from '@/composables/usePagination'
import { AGENCY_STATUSES } from '@/constants/status'
import { useAuthStore } from '@/stores/auth.store'
import { statusLabel } from '@/utils/formatStatus'
import InstansiLaporanItem from '@/components/laporan/InstansiLaporanItem.vue'
import BaseEmptyState from '@/components/common/BaseEmptyState.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'

const { items, loading, loadingMore, error, hasMore, load, loadMore } = usePagination(
  instansiApi.listLaporan,
  { limit: 12 },
)

const auth = useAuthStore()
const filters = reactive({ q: '', status: '', subcategoryId: '', districtId: '' })

// Pilihan filter dari master data. Kalau gagal dimuat, dropdown-nya saja yang disembunyikan.
const categories = ref([])
const districts = ref([])

const myAgencyId = computed(() => auth.user?.agencyId ?? auth.user?.agency?.id ?? null)

// Petugas hanya perlu subjenis milik instansinya (dicek jika data subjenis membawa info instansi).
const belongsToMyAgency = (sub) => {
  const subAgencyId = sub.agencyId ?? sub.agency?.id
  return myAgencyId.value === null || subAgencyId === undefined || subAgencyId === myAgencyId.value
}
const subcategoryGroups = computed(() =>
  categories.value
    .map((category) => ({
      ...category,
      subcategories: (category.subcategories ?? []).filter(belongsToMyAgency),
    }))
    .filter((category) => category.subcategories.length > 0),
)

async function loadFilterOptions() {
  const [cats, dists] = await Promise.allSettled([masterApi.categories(), masterApi.districts()])
  if (cats.status === 'fulfilled') categories.value = cats.value.data?.data ?? []
  if (dists.status === 'fulfilled') districts.value = dists.value.data?.data ?? []
}

// BE menolak kata kunci kurang dari 2 karakter, jadi tidak dikirim sampai cukup panjang.
const keywordTooShort = computed(() => {
  const length = filters.q.trim().length
  return length > 0 && length < 2
})

const hasFilter = computed(() =>
  Boolean(filters.q.trim() || filters.status || filters.subcategoryId || filters.districtId),
)

const buildParams = () => {
  const q = filters.q.trim()
  return {
    q: q.length >= 2 ? q : undefined,
    status: filters.status || undefined,
    subcategoryId: filters.subcategoryId || undefined,
    districtId: filters.districtId || undefined,
  }
}

let lastKey = '' // jangan muat ulang kalau parameternya sama
function applyFilters() {
  const params = buildParams()
  const key = JSON.stringify(params)
  if (key === lastKey) return
  lastKey = key
  load(params)
}

// Kata kunci: tunggu user berhenti mengetik. Pilihan lain: langsung.
let timer
watch(() => filters.q, () => {
  clearTimeout(timer)
  timer = setTimeout(applyFilters, 400)
})
watch(() => [filters.status, filters.subcategoryId, filters.districtId], applyFilters)

onMounted(() => {
  loadFilterOptions()
  const params = buildParams()
  lastKey = JSON.stringify(params)
  load(params)
})
onBeforeUnmount(() => clearTimeout(timer))

function resetFilters() {
  clearTimeout(timer)
  filters.q = ''
  filters.status = ''
  filters.subcategoryId = ''
  filters.districtId = ''
  applyFilters()
}

// ---- Hanya untuk tampilan ----
// Tab status memakai filters.status yang sama dengan sebelumnya ('' = semua).
const STATUS_ICONS = { '': FileText, DITERUSKAN: Send, DALAM_PENANGANAN: Clock, SELESAI: CircleCheck }
const tabs = [
  { value: '', label: 'Semua Laporan' },
  ...AGENCY_STATUSES.map((status) => ({ value: status, label: statusLabel(status) })),
]

const fieldClass =
  'h-11 w-full appearance-none rounded-full border border-maroon/25 bg-white/60 pl-4 pr-10 text-sm text-maroon ' +
  'focus:border-maroon focus:outline-none focus:ring-2 focus:ring-lime'
</script>

<template>
  <section class="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
    <header class="relative">
      <svg viewBox="0 0 50 40" class="absolute right-2 top-0 hidden h-10 w-12 sm:block" fill="none" stroke="#44242d" stroke-width="3" stroke-linecap="round" aria-hidden="true">
        <path d="M8 34l8-10M20 28l4-16M32 30l12-8" />
      </svg>
      <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl">Daftar Laporan</h1>
      <p class="mt-2 text-sm font-medium sm:text-base">Laporan yang diteruskan admin ke instansi Anda. Buka laporan untuk memperbarui progresnya.</p>
    </header>

    <!-- Tab status -->
    <div class="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter status">
      <button
        v-for="tab in tabs"
        :key="tab.value || 'semua'"
        type="button"
        class="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors"
        :class="filters.status === tab.value ? 'border-maroon bg-maroon text-white' : 'border-maroon/25 bg-white/60 hover:bg-sand'"
        :aria-pressed="filters.status === tab.value"
        @click="filters.status = tab.value"
      >
        <component :is="STATUS_ICONS[tab.value]" class="size-4" aria-hidden="true" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Pencarian + filter -->
    <form class="mt-4 flex flex-wrap items-center gap-3" role="search" @submit.prevent="applyFilters">
      <div class="relative min-w-0 flex-1 basis-60">
        <label for="agency-filter-q" class="sr-only">Cari laporan</label>
        <Search class="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2" aria-hidden="true" />
        <input
          id="agency-filter-q"
          v-model="filters.q"
          class="h-11 w-full rounded-full border border-maroon/25 bg-white/60 pl-11 pr-4 text-sm text-maroon placeholder:text-maroon/50 focus:border-maroon focus:outline-none focus:ring-2 focus:ring-lime"
          type="search"
          placeholder="Kode laporan, kata kunci, atau alamat"
        />
      </div>

      <div v-if="subcategoryGroups.length" class="relative w-full sm:w-56">
        <label for="agency-filter-subcategory" class="sr-only">Jenis laporan</label>
        <select id="agency-filter-subcategory" v-model="filters.subcategoryId" :class="fieldClass">
          <option value="">Semua jenis</option>
          <optgroup v-for="category in subcategoryGroups" :key="category.id" :label="category.name">
            <option v-for="sub in category.subcategories" :key="sub.id" :value="sub.id">{{ sub.name }}</option>
          </optgroup>
        </select>
        <ChevronDown class="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2" aria-hidden="true" />
      </div>

      <div v-if="districts.length" class="relative w-full sm:w-52">
        <label for="agency-filter-district" class="sr-only">Kecamatan</label>
        <select id="agency-filter-district" v-model="filters.districtId" :class="fieldClass">
          <option value="">Semua kecamatan</option>
          <option v-for="district in districts" :key="district.id" :value="district.id">{{ district.name }}</option>
        </select>
        <ChevronDown class="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2" aria-hidden="true" />
      </div>

      <button
        v-if="hasFilter"
        type="button"
        class="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full px-4 text-sm font-bold underline-offset-2 hover:underline"
        @click="resetFilters"
      >
        <X class="size-4" aria-hidden="true" /> Atur ulang
      </button>
    </form>
    <p v-if="keywordTooShort" class="mt-2 px-2 text-xs font-medium">Kata kunci minimal 2 karakter.</p>

    <p v-if="error" class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">{{ error }}</p>

    <div class="mt-6">
      <BaseLoading v-if="loading" text="Memuat laporan..." />

      <BaseEmptyState
        v-else-if="!items.length && !error"
        :title="hasFilter ? 'Tidak ada laporan yang cocok' : 'Belum ada laporan untuk instansi Anda'"
        :description="
          hasFilter
            ? 'Ubah kata kunci atau status, lalu coba lagi.'
            : 'Laporan akan muncul di sini setelah admin meneruskannya.'
        "
      />

      <template v-else-if="items.length">
        <ul class="space-y-4">
          <li v-for="report in items" :key="report.id">
            <InstansiLaporanItem :report="report" />
          </li>
        </ul>

        <div class="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p class="text-sm">Menampilkan {{ items.length }} laporan</p>
          <button
            v-if="hasMore"
            type="button"
            class="inline-flex h-11 cursor-pointer items-center justify-center rounded-full border-2 border-maroon px-6 text-sm font-bold transition-colors hover:bg-maroon hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="loadingMore"
            @click="loadMore"
          >
            {{ loadingMore ? 'Memuat...' : 'Muat lebih banyak' }}
          </button>
        </div>
      </template>
    </div>
  </section>
</template>
