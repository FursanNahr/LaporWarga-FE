<script setup>
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { Building2, ChevronDown, ImagePlus, LayoutGrid, LocateFixed, X } from 'lucide-vue-next'
import { useGeolocation } from '@/composables/useGeolocation'
import { REPORT_PHOTO, validatePhotoFile, validateReport } from '@/utils/validators'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import LocationPicker from '@/components/laporan/LocationPicker.vue'

/**
 * LaporanForm: form membuat laporan (POST /reports, multipart).
 * Form hanya mengurus tampilan + validasi + menyusun FormData; pemanggilan API ada di halaman.
 *
 * Props
 *  - categories : hasil GET /categories
 *  - loading    : true saat request sedang berjalan
 *  - errors     : error per field dari server, mis. { description: '...' }
 * Event
 *  - submit(FormData)
 */
const props = defineProps({
  categories: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  errors: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['submit'])

const form = reactive({
  description: '',
  subcategoryId: '',
  address: '',
  latitude: '',
  longitude: '',
  isAnonymous: false,
})
const photos = ref([]) // [{ file, url }]  url = object URL untuk pratinjau
const localErrors = ref({})
const photoNotice = ref('') // pesan saat memilih file (format/ukuran/jumlah)
const dragging = ref(false) // true saat file sedang diseret ke area upload

const { loading: locating, error: geoError, locate } = useGeolocation()

// Error lokal (validasi di browser) menimpa error dari server untuk field yang sama
const shown = computed(() => ({ ...props.errors, ...localErrors.value }))

// Instansi yang menangani, ditentukan BE dari subjenis. Hanya sebagai informasi untuk user.
const selectedAgency = computed(() => {
  for (const category of props.categories) {
    const sub = category.subcategories.find((s) => String(s.id) === String(form.subcategoryId))
    if (sub) return sub.agency?.name ?? ''
  }
  return ''
})

const photosFull = computed(() => photos.value.length >= REPORT_PHOTO.maxFiles)
const descriptionLength = computed(() => form.description.trim().length)

// Titik lokasi dari tombol "Gunakan lokasi saya" maupun klik/geser pin di peta
function setCoordinates({ latitude, longitude }) {
  form.latitude = latitude.toFixed(6)
  form.longitude = longitude.toFixed(6)
  delete localErrors.value.latitude
  delete localErrors.value.longitude
}

async function fillMyLocation() {
  const position = await locate()
  if (!position) return
  setCoordinates(position)
}

function addPhotos(files) {
  const notices = []
  for (const file of files) {
    if (photos.value.length >= REPORT_PHOTO.maxFiles) {
      notices.push(`Maksimal ${REPORT_PHOTO.maxFiles} foto`)
      break
    }
    const problem = validatePhotoFile(file)
    if (problem) {
      notices.push(`${file.name}: ${problem}`)
      continue
    }
    photos.value.push({ file, url: URL.createObjectURL(file) })
  }

  photoNotice.value = notices.join('. ')
  if (photos.value.length) delete localErrors.value.photos
}

function onPickPhotos(event) {
  const picked = Array.from(event.target.files ?? [])
  event.target.value = '' // supaya file yang sama bisa dipilih lagi setelah dihapus
  addPhotos(picked)
}

function onDropPhotos(event) {
  dragging.value = false
  addPhotos(Array.from(event.dataTransfer?.files ?? []))
}

function removePhoto(index) {
  URL.revokeObjectURL(photos.value[index].url)
  photos.value.splice(index, 1)
  photoNotice.value = ''
}

onBeforeUnmount(() => photos.value.forEach((photo) => URL.revokeObjectURL(photo.url)))

function onSubmit() {
  localErrors.value = validateReport({ ...form, photos: photos.value })
  if (Object.keys(localErrors.value).length) return

  // multipart/form-data: semua nilai berupa string, foto di field `photos` (sesuai BE)
  const data = new FormData()
  data.append('description', form.description.trim())
  data.append('subcategoryId', String(form.subcategoryId))
  data.append('latitude', form.latitude)
  data.append('longitude', form.longitude)
  if (form.address.trim()) data.append('address', form.address.trim())
  data.append('isAnonymous', String(form.isAnonymous))
  photos.value.forEach(({ file }) => data.append('photos', file))

  emit('submit', data)
}

// Kelas bersama supaya textarea / select seragam dengan BaseInput (h-12, rounded-full, bg-white/60).
const labelClass = 'mb-1.5 block text-sm font-bold text-maroon'
const controlClass =
  'w-full border bg-white/60 text-sm placeholder:text-maroon/50 focus:outline-none focus:ring-2 focus:ring-lime'
const borderClass = (hasError) => (hasError ? 'border-red-600' : 'border-maroon/25 focus:border-maroon')
const errorClass = 'mt-1.5 px-2 text-xs font-medium text-red-700'
</script>

<template>
  <form class="space-y-6" novalidate @submit.prevent="onSubmit">
    <!-- Jenis laporan -->
    <div>
      <label for="report-subcategory" :class="labelClass">Jenis Laporan</label>
      <div class="relative">
        <LayoutGrid
          class="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-maroon"
          aria-hidden="true"
        />
        <select
          id="report-subcategory"
          v-model="form.subcategoryId"
          :class="[
            controlClass,
            borderClass(shown.subcategoryId),
            'h-12 cursor-pointer appearance-none rounded-full pl-12 pr-12',
            form.subcategoryId === '' ? 'text-maroon/50' : 'text-maroon',
          ]"
          :aria-invalid="!!shown.subcategoryId"
        >
          <option value="">Pilih jenis laporan</option>
          <optgroup v-for="category in categories" :key="category.id" :label="category.name">
            <option v-for="sub in category.subcategories" :key="sub.id" :value="sub.id" class="text-maroon">
              {{ sub.name }}
            </option>
          </optgroup>
        </select>
        <ChevronDown
          class="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-maroon"
          aria-hidden="true"
        />
      </div>
      <p v-if="selectedAgency" class="mt-2 flex items-center gap-2 px-2 text-xs font-medium text-maroon/70">
        <Building2 class="size-4 shrink-0" aria-hidden="true" />
        Ditangani oleh: {{ selectedAgency }}
      </p>
      <p v-if="shown.subcategoryId" :class="errorClass" role="alert">{{ shown.subcategoryId }}</p>
    </div>

    <!-- Lokasi kejadian -->
    <fieldset class="min-w-0">
      <legend class="text-sm font-bold text-maroon">Lokasi Kejadian</legend>

      <div class="mt-1.5 space-y-4 rounded-3xl border border-maroon/25 bg-white/60 p-4 sm:p-5">
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
          <BaseButton variant="secondary" :loading="locating" @click="fillMyLocation">
            <LocateFixed class="size-4" aria-hidden="true" />
            Gunakan lokasi saya
          </BaseButton>
          <p class="text-xs text-maroon/60">atau klik peta / geser pin untuk memilih lokasi</p>
        </div>
        <p v-if="geoError" :class="errorClass" role="alert">{{ geoError }}</p>

        <LocationPicker
          class="h-64 sm:h-80"
          :latitude="form.latitude"
          :longitude="form.longitude"
          @pick="setCoordinates"
        />

        <div class="grid gap-3 sm:grid-cols-2">
          <BaseInput
            v-model="form.latitude"
            label="Latitude"
            type="number"
            step="any"
            inputmode="decimal"
            placeholder="-6.914744"
            :error="shown.latitude"
          />
          <BaseInput
            v-model="form.longitude"
            label="Longitude"
            type="number"
            step="any"
            inputmode="decimal"
            placeholder="107.609810"
            :error="shown.longitude"
          />
        </div>

        <BaseInput
          v-model="form.address"
          label="Alamat (opsional)"
          autocomplete="street-address"
          :error="shown.address"
        />
      </div>
    </fieldset>

    <!-- Deskripsi -->
    <div>
      <label for="report-description" :class="labelClass">Deskripsi Laporan</label>
      <textarea
        id="report-description"
        v-model="form.description"
        rows="5"
        :class="[controlClass, borderClass(shown.description), 'min-h-32 resize-y rounded-3xl px-5 py-3.5 text-maroon']"
        placeholder="Ceritakan apa yang terjadi, sejak kapan, dan dampaknya"
        :aria-invalid="!!shown.description"
      ></textarea>
      <div class="mt-1.5 flex items-start justify-between gap-3 px-2">
        <p v-if="shown.description" class="text-xs font-medium text-red-700" role="alert">{{ shown.description }}</p>
        <span v-else></span>
        <span class="text-xs" :class="descriptionLength > 2000 ? 'font-semibold text-red-700' : 'text-maroon/60'">
          {{ descriptionLength }}/2000
        </span>
      </div>
    </div>

    <!-- Foto bukti -->
    <div>
      <div class="flex items-baseline justify-between gap-3">
        <span class="text-sm font-bold text-maroon">Foto Bukti</span>
        <span class="text-xs font-medium text-maroon/60">{{ photos.length }}/{{ REPORT_PHOTO.maxFiles }}</span>
      </div>
      <p id="report-photos-hint" class="mb-2 mt-0.5 text-xs text-maroon/60">
        Minimal 1, maksimal {{ REPORT_PHOTO.maxFiles }} foto. Maksimal {{ REPORT_PHOTO.maxSizeMB }} MB per foto
        (JPG, PNG, atau WEBP).
      </p>

      <!-- Input asli disembunyikan; label di bawah jadi area klik + drag-and-drop -->
      <input
        id="report-photos"
        class="peer sr-only"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        aria-describedby="report-photos-hint"
        :disabled="photosFull"
        :aria-invalid="!!(shown.photos || photoNotice)"
        @change="onPickPhotos"
      />
      <label
        for="report-photos"
        class="flex min-h-24 cursor-pointer items-center justify-center gap-3 rounded-3xl border px-6 py-6 text-center text-sm font-semibold text-maroon transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-lime peer-disabled:cursor-not-allowed peer-disabled:opacity-60"
        :class="[
          dragging
            ? 'border-maroon bg-lime/20'
            : shown.photos
              ? 'border-red-600 bg-sand'
              : 'border-sand-dark bg-sand hover:bg-sand-dark/50',
        ]"
        @dragover.prevent="dragging = true"
        @dragleave="dragging = false"
        @drop.prevent="onDropPhotos"
      >
        <ImagePlus class="pointer-events-none size-6 shrink-0" aria-hidden="true" />
        <span class="pointer-events-none">
          {{ photosFull ? 'Jumlah foto maksimal tercapai' : 'Pilih foto atau unggah di sini' }}
        </span>
      </label>

      <p v-if="photoNotice" :class="errorClass" role="alert">{{ photoNotice }}</p>
      <p v-if="shown.photos" :class="errorClass" role="alert">{{ shown.photos }}</p>

      <ul v-if="photos.length" class="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
        <li
          v-for="(photo, index) in photos"
          :key="photo.url"
          class="relative aspect-square overflow-hidden rounded-2xl border border-maroon/15 bg-sand"
        >
          <img :src="photo.url" :alt="`Pratinjau foto ${index + 1}`" class="size-full object-cover" />
          <button
            type="button"
            class="absolute right-1.5 top-1.5 flex size-7 cursor-pointer items-center justify-center rounded-full bg-maroon text-white shadow transition-colors hover:bg-maroon-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-lime"
            :aria-label="`Hapus foto ${index + 1}`"
            @click="removePhoto(index)"
          >
            <X class="size-4" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </div>

    <!-- Anonim -->
    <label class="flex cursor-pointer items-center gap-3 text-sm font-medium text-maroon">
      <input v-model="form.isAnonymous" type="checkbox" class="size-5 shrink-0 cursor-pointer rounded accent-maroon" />
      Sembunyikan identitasku (laporan anonim)
    </label>

    <BaseButton type="submit" class="w-full sm:w-auto" :loading="loading">Kirim laporan</BaseButton>
  </form>
</template>