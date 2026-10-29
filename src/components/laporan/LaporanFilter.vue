<script setup>
import { onBeforeUnmount, reactive, watch } from 'vue'
import { useGeolocation } from '@/composables/useGeolocation'
import { PUBLIC_STATUSES } from '@/constants/status'
import { statusLabel } from '@/utils/formatStatus'

/**
 * LaporanFilter: filter feed publik (kata kunci, status, subjenis, "dekat saya").
 * Memancarkan event `change` dengan params yang SUDAH bersih, siap dikirim ke GET /reports:
 *   { q?, status?, subcategoryId?, lat?, lng?, radius? }
 *
 * Props
 *  - categories : hasil GET /categories (kategori > subcategories)
 */
defineProps({
  categories: { type: Array, default: () => [] },
})
const emit = defineEmits(['change'])

// Batas radius BE: 50 m sampai 10.000 m
const RADIUS_OPTIONS = [
  { value: 500, label: '500 m' },
  { value: 1000, label: '1 km' },
  { value: 2000, label: '2 km' },
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
]

const initialState = () => ({ q: '', status: '', subcategoryId: '', nearMe: false, radius: 1000 })
const state = reactive(initialState())

const { coords, loading: locating, error: geoError, locate } = useGeolocation()

let lastKey = '{}' // halaman induk memuat dengan params kosong; jangan kirim ulang yang sama
function emitChange() {
  const q = state.q.trim()
  const params = {
    q: q.length >= 2 ? q : undefined, // BE menolak kata kunci < 2 karakter
    status: state.status || undefined,
    subcategoryId: state.subcategoryId || undefined,
  }
  if (state.nearMe && coords.value) {
    params.lat = coords.value.latitude
    params.lng = coords.value.longitude
    params.radius = state.radius
  }

  const key = JSON.stringify(params)
  if (key === lastKey) return
  lastKey = key
  emit('change', params)
}

// Kata kunci: tunggu user berhenti mengetik. Pilihan lain: langsung.
let timer
watch(() => state.q, () => {
  clearTimeout(timer)
  timer = setTimeout(emitChange, 400)
})
watch(() => [state.status, state.subcategoryId, state.radius], emitChange)
watch(() => state.nearMe, async (on) => {
  if (on) {
    const position = await locate()
    if (!position) state.nearMe = false // gagal (izin ditolak dsb.): batalkan centang
  }
  emitChange()
})
onBeforeUnmount(() => clearTimeout(timer))

function reset() {
  clearTimeout(timer)
  Object.assign(state, initialState())
  emitChange()
}
</script>

<template>
  <form class="filter" role="search" @submit.prevent="emitChange">
    <div class="filter__row">
      <div class="filter__field filter__field--grow">
        <label for="filter-q">Cari laporan</label>
        <input
          id="filter-q"
          v-model="state.q"
          class="control"
          type="search"
          placeholder="Kode laporan, kata kunci, atau alamat"
        />
      </div>

      <div class="filter__field">
        <label for="filter-status">Status</label>
        <select id="filter-status" v-model="state.status" class="control">
          <option value="">Semua status</option>
          <option v-for="status in PUBLIC_STATUSES" :key="status" :value="status">
            {{ statusLabel(status) }}
          </option>
        </select>
      </div>

      <div v-if="categories.length" class="filter__field">
        <label for="filter-subcategory">Jenis laporan</label>
        <select id="filter-subcategory" v-model="state.subcategoryId" class="control">
          <option value="">Semua jenis</option>
          <optgroup v-for="category in categories" :key="category.id" :label="category.name">
            <option v-for="sub in category.subcategories" :key="sub.id" :value="sub.id">
              {{ sub.name }}
            </option>
          </optgroup>
        </select>
      </div>
    </div>

    <div class="filter__row filter__row--center">
      <label class="filter__check">
        <input v-model="state.nearMe" type="checkbox" />
        Dekat saya
      </label>

      <template v-if="state.nearMe">
        <label for="filter-radius" class="sr-only">Radius</label>
        <select id="filter-radius" v-model="state.radius" class="control filter__radius">
          <option v-for="option in RADIUS_OPTIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </template>

      <span v-if="locating" class="filter__hint">Mencari lokasi...</span>
      <span v-if="geoError" class="filter__error" role="alert">{{ geoError }}</span>

      <button type="button" class="btn filter__reset" @click="reset">Atur ulang</button>
    </div>
  </form>
</template>

<style scoped>
.filter {
  margin-bottom: 1.5rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg-soft);
}
.filter__row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.filter__row--center {
  align-items: center;
  margin-top: 0.75rem;
}
.filter__field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 160px;
}
.filter__field--grow { flex: 1 1 240px; }
.filter__field label { font-size: 0.875rem; color: var(--color-text-muted); }
.filter__check { display: flex; align-items: center; gap: 0.5rem; }
.filter__radius { width: auto; }
.filter__hint { color: var(--color-text-muted); font-size: 0.875rem; }
.filter__error { color: #b91c1c; font-size: 0.875rem; }
.filter__reset { margin-left: auto; }
</style>