<script setup>
import { computed } from 'vue'
import { ChevronDown, MapPin } from 'lucide-vue-next'
import { PUBLIC_STATUSES, STATUS_META } from '@/constants/status'

/**
 * FeedFilterBar: pil filter di atas grid feed. Hanya tampilan; FeedPage yang memegang nilainya.
 *
 * `location` berisi 'all', 'nearby', atau `district:<id>`. Perubahannya sengaja tidak langsung
 * dipakai: kalau FeedPage menolak (mis. izin lokasi ditolak), pilihan di layar dikembalikan.
 */
const props = defineProps({
  location: { type: String, default: 'all' },
  agencyId: { type: [String, Number], default: '' },
  status: { type: String, default: '' },
  sort: { type: String, default: 'latest' },
  districts: { type: Array, default: () => [] }, // [{ id, name }]
  agencies: { type: Array, default: () => [] }, // [{ id, name }]
  locating: { type: Boolean, default: false },
  dirty: { type: Boolean, default: false },
})
const emit = defineEmits(['update:location', 'update:agencyId', 'update:status', 'update:sort', 'reset'])

const SORTS = [
  { value: 'latest', label: 'Urutkan: Terbaru' },
  { value: 'popular', label: 'Urutkan: Terpopuler' },
]

// Tiga pil biasa (selain lokasi). `defaultValue` menentukan kapan pilnya dianggap sedang memfilter.
const fields = computed(() => [
  {
    key: 'agencyId',
    label: 'Instansi',
    value: props.agencyId,
    defaultValue: '',
    empty: 'Semua Instansi',
    options: props.agencies.map((agency) => ({ value: agency.id, label: agency.name })),
  },
  {
    key: 'status',
    label: 'Status',
    value: props.status,
    defaultValue: '',
    empty: 'Semua Status',
    options: PUBLIC_STATUSES.map((status) => ({ value: status, label: STATUS_META[status]?.label ?? status })),
  },
  { key: 'sort', label: 'Urutan', value: props.sort, defaultValue: 'latest', options: SORTS },
])

function onLocation(event) {
  const select = event.target
  emit('update:location', select.value)
  // Kembalikan dulu ke nilai lama. Kalau FeedPage menerima, props berubah dan Vue mengisinya ulang.
  select.value = props.location
}

function onField(key, event) {
  emit(`update:${key}`, event.target.value)
}

const selectBase =
  'h-11 cursor-pointer appearance-none rounded-full border pr-10 text-sm font-semibold transition-colors ' +
  'disabled:cursor-wait disabled:opacity-70'
</script>

<template>
  <div class="-mx-4 flex items-center gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
    <label class="relative shrink-0">
      <span class="sr-only">Lokasi</span>
      <MapPin class="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white" aria-hidden="true" />
      <select
        :value="location"
        :disabled="locating"
        :class="[selectBase, 'border-maroon bg-maroon pl-10 text-white']"
        @change="onLocation"
      >
        <option value="all" class="bg-white text-maroon">Semua Lokasi</option>
        <option value="nearby" class="bg-white text-maroon">Dekat Saya</option>
        <optgroup v-if="districts.length" label="Kecamatan">
          <option v-for="district in districts" :key="district.id" :value="`district:${district.id}`" class="bg-white text-maroon">
            {{ district.name }}
          </option>
        </optgroup>
      </select>
      <ChevronDown class="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-white" aria-hidden="true" />
    </label>

    <label v-for="field in fields" :key="field.key" class="relative shrink-0">
      <span class="sr-only">{{ field.label }}</span>
      <select
        :value="field.value"
        :class="[
          selectBase,
          'pl-5 text-maroon',
          String(field.value) !== String(field.defaultValue) ? 'border-maroon bg-lime/40' : 'border-sand-dark bg-white/80 hover:bg-white',
        ]"
        @change="onField(field.key, $event)"
      >
        <option v-if="field.empty" value="" class="bg-white text-maroon">{{ field.empty }}</option>
        <option v-for="option in field.options" :key="option.value" :value="option.value" class="bg-white text-maroon">
          {{ option.label }}
        </option>
      </select>
      <ChevronDown class="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2" aria-hidden="true" />
    </label>

    <button
      v-if="dirty"
      type="button"
      class="shrink-0 cursor-pointer px-2 text-sm font-bold underline underline-offset-4 hover:text-maroon-dark"
      @click="emit('reset')"
    >
      Atur ulang
    </button>
  </div>
</template>