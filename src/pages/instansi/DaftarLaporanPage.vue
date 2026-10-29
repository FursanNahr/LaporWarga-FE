<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { instansiApi } from '@/api/instansi.api'
import { masterApi } from '@/api/master.api'
import { usePagination } from '@/composables/usePagination'
import { AGENCY_STATUSES, REPORT_STATUS } from '@/constants/status'
import { useAuthStore } from '@/stores/auth.store'
import { statusLabel } from '@/utils/formatStatus'
import LaporanCard from '@/components/laporan/LaporanCard.vue'
import BaseEmptyState from '@/components/common/BaseEmptyState.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import BasePagination from '@/components/common/BasePagination.vue'

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
</script>

<template>
  <section class="container page">
    <header class="page__header">
      <h1>Daftar laporan</h1>
      <p>Laporan yang diteruskan admin ke instansi Anda. Buka laporan untuk memperbarui progresnya.</p>
    </header>

    <form class="filter" role="search" @submit.prevent="applyFilters">
      <div class="filter__field filter__field--grow">
        <label for="agency-filter-q">Cari laporan</label>
        <input
          id="agency-filter-q"
          v-model="filters.q"
          class="control"
          type="search"
          placeholder="Kode laporan, kata kunci, atau alamat"
        />
        <small v-if="keywordTooShort" class="filter__hint">Kata kunci minimal 2 karakter.</small>
      </div>

      <div class="filter__field">
        <label for="agency-filter-status">Status</label>
        <select id="agency-filter-status" v-model="filters.status" class="control">
          <option value="">Semua status</option>
          <option v-for="status in AGENCY_STATUSES" :key="status" :value="status">
            {{ statusLabel(status) }}
          </option>
        </select>
      </div>

      <div v-if="subcategoryGroups.length" class="filter__field">
        <label for="agency-filter-subcategory">Jenis laporan</label>
        <select id="agency-filter-subcategory" v-model="filters.subcategoryId" class="control">
          <option value="">Semua jenis</option>
          <optgroup v-for="category in subcategoryGroups" :key="category.id" :label="category.name">
            <option v-for="sub in category.subcategories" :key="sub.id" :value="sub.id">
              {{ sub.name }}
            </option>
          </optgroup>
        </select>
      </div>

      <div v-if="districts.length" class="filter__field">
        <label for="agency-filter-district">Kecamatan</label>
        <select id="agency-filter-district" v-model="filters.districtId" class="control">
          <option value="">Semua kecamatan</option>
          <option v-for="district in districts" :key="district.id" :value="district.id">
            {{ district.name }}
          </option>
        </select>
      </div>

      <button v-if="hasFilter" type="button" class="btn filter__reset" @click="resetFilters">
        Atur ulang
      </button>
    </form>

    <p v-if="error" class="page__error" role="alert">{{ error }}</p>

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

    <ul v-else class="reports">
      <li v-for="report in items" :key="report.id" class="reports__item">
        <LaporanCard :report="report" />
        <div class="reports__actions">
          <RouterLink
            :to="{ name: 'instansi-kelola-progress', params: { id: report.id } }"
            class="btn btn-primary"
          >
            {{ report.status === REPORT_STATUS.SELESAI ? 'Lihat progres' : 'Kelola progres' }}
          </RouterLink>
        </div>
      </li>
    </ul>

    <BasePagination :has-more="hasMore" :loading="loadingMore" @load-more="loadMore" />
  </section>
</template>

<style scoped>
.page { padding-block: 1.5rem; }
.page__header { margin-bottom: 1.5rem; }
.page__header h1 { margin: 0 0 0.25rem; }
.page__header p { margin: 0; color: var(--color-text-muted); }
.page__error { color: var(--color-danger, #b91c1c); }

.filter {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.filter__field { display: grid; gap: 0.25rem; }
.filter__field--grow { flex: 1 1 16rem; }
.filter__hint { color: var(--color-text-muted); }

.reports {
  display: grid;
  gap: 1.25rem;
  margin: 0 0 1.5rem;
  padding: 0;
  list-style: none;
}
.reports__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}
</style>