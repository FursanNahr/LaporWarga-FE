<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import {
  BadgeCheck,
  Check,
  ChevronDown,
  Clock,
  CornerUpRight,
  LayoutGrid,
  SlidersHorizontal,
} from 'lucide-vue-next'
import { useGeolocation } from '@/composables/useGeolocation'
import { PUBLIC_STATUSES, REPORT_STATUS } from '@/constants/status'
import { statusLabel } from '@/utils/formatStatus'

/**
 * LaporanFilter: baris chip status + tombol "Filter" (dropdown: jenis laporan, "dekat saya", radius).
 * Kata kunci TIDAK ada di sini: berasal dari kolom cari di navbar (?q=) dan dikelola halaman induk.
 *
 * Event `change` membawa params yang SUDAH bersih (hanya key yang terisi), siap digabung ke GET /reports:
 *   { status?, subcategoryId?, lat?, lng?, radius? }
 *
 * Props
 *  - categories : hasil GET /categories (kategori > subcategories)
 * Slot
 *  - summary    : teks ringkas di sisi kanan, mis. "Menampilkan 12 laporan"
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

// Chip mengikuti status yang memang tampil di feed publik (PUBLIC_STATUSES).
const STATUS_ICON = {
  [REPORT_STATUS.TERVERIFIKASI]: BadgeCheck,
  [REPORT_STATUS.DITERUSKAN]: CornerUpRight,
  [REPORT_STATUS.DALAM_PENANGANAN]: Clock,
  [REPORT_STATUS.SELESAI]: Check,
}
const STATUS_CHIPS = [
  { value: '', label: 'Semua Laporan', icon: LayoutGrid },
  ...PUBLIC_STATUSES.map((value) => ({
    value,
    label: statusLabel(value),
    icon: STATUS_ICON[value] ?? Clock,
  })),
]

const initialState = () => ({ status: '', subcategoryId: '', nearMe: false, radius: 1000 })
const state = reactive(initialState())

const { coords, loading: locating, error: geoError, locate } = useGeolocation()

// Jumlah filter di dalam dropdown yang sedang aktif (ditampilkan di tombol Filter)
const activeCount = computed(() => (state.subcategoryId ? 1 : 0) + (state.nearMe ? 1 : 0))

let lastKey = '{}' // halaman induk memuat dengan params kosong; jangan kirim ulang yang sama
function emitChange() {
  const params = {}
  if (state.status) params.status = state.status
  if (state.subcategoryId) params.subcategoryId = state.subcategoryId
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

// Semua pilihan langsung berlaku (tanpa tombol "Terapkan")
watch(() => [state.status, state.subcategoryId, state.radius], emitChange)
watch(() => state.nearMe, async (on) => {
  if (on) {
    const position = await locate()
    if (!position) state.nearMe = false // gagal (izin ditolak dsb.): batalkan centang
  }
  emitChange()
})

function reset() {
  Object.assign(state, initialState())
  emitChange()
}

// ---- Dropdown: tutup saat klik di luar atau tekan Escape ----
const open = ref(false)
const root = ref(null)
const onPointerDown = (event) => {
  if (open.value && root.value && !root.value.contains(event.target)) open.value = false
}
const onKeydown = (event) => {
  if (event.key === 'Escape') open.value = false
}
onMounted(() => {
  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('keydown', onKeydown)
})

const fieldClass =
  'h-11 w-full rounded-xl border border-sand-dark bg-white px-3 text-sm text-maroon focus:border-maroon focus:outline-none'
</script>

<template>
  <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
    <div role="group" aria-label="Filter status laporan" class="flex flex-wrap gap-2">
      <button
        v-for="chip in STATUS_CHIPS"
        :key="chip.value || 'semua'"
        type="button"
        :aria-pressed="state.status === chip.value"
        class="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors"
        :class="
          state.status === chip.value
            ? 'border-maroon bg-maroon text-white'
            : 'border-maroon/30 bg-white/70 text-maroon hover:border-maroon'
        "
        @click="state.status = chip.value"
      >
        <component :is="chip.icon" class="size-4" aria-hidden="true" />
        {{ chip.label }}
      </button>
    </div>

    <div class="flex items-center justify-between gap-4 lg:justify-end">
      <slot name="summary" />

      <div ref="root" class="relative">
        <button
          type="button"
          class="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-maroon px-5 text-sm font-bold text-white transition-colors hover:bg-maroon-dark"
          :aria-expanded="open"
          aria-controls="laporan-filter-panel"
          @click="open = !open"
        >
          <SlidersHorizontal class="size-4" aria-hidden="true" />
          Filter
          <span
            v-if="activeCount"
            class="grid size-5 place-items-center rounded-full bg-lime text-xs font-extrabold text-maroon"
          >
            {{ activeCount }}
          </span>
          <ChevronDown
            class="size-4 transition-transform motion-reduce:transition-none"
            :class="open && 'rotate-180'"
            aria-hidden="true"
          />
        </button>

        <div
          v-if="open"
          id="laporan-filter-panel"
          role="group"
          aria-label="Filter laporan"
          class="absolute right-0 top-full z-30 mt-2 flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-4 rounded-2xl border border-sand-dark bg-white p-5 shadow-xl"
        >
          <div v-if="categories.length" class="flex flex-col gap-1.5">
            <label for="filter-jenis" class="text-sm font-bold text-maroon">Jenis laporan</label>
            <select id="filter-jenis" v-model="state.subcategoryId" :class="fieldClass">
              <option value="">Semua jenis</option>
              <optgroup v-for="category in categories" :key="category.id" :label="category.name">
                <option v-for="sub in category.subcategories" :key="sub.id" :value="sub.id">
                  {{ sub.name }}
                </option>
              </optgroup>
            </select>
          </div>

          <div class="flex flex-col gap-2">
            <label class="flex cursor-pointer items-center gap-3 text-sm font-bold text-maroon">
              <input v-model="state.nearMe" type="checkbox" class="size-4 cursor-pointer accent-maroon" />
              Dekat saya
            </label>
            <p v-if="locating" class="text-xs text-maroon/70" role="status">Mencari lokasimu...</p>
            <p v-else-if="geoError" class="text-xs text-red-700" role="alert">{{ geoError }}</p>
          </div>

          <div v-if="state.nearMe" class="flex flex-col gap-1.5">
            <label for="filter-radius" class="text-sm font-bold text-maroon">Radius</label>
            <select id="filter-radius" v-model="state.radius" :class="fieldClass">
              <option v-for="option in RADIUS_OPTIONS" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <div class="flex items-center justify-between border-t border-sand-dark pt-4">
            <button
              type="button"
              class="cursor-pointer text-sm font-bold text-maroon underline-offset-4 hover:underline"
              @click="reset"
            >
              Atur ulang
            </button>
            <button
              type="button"
              class="h-10 cursor-pointer rounded-full bg-maroon px-5 text-sm font-bold text-white transition-colors hover:bg-maroon-dark"
              @click="open = false"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>