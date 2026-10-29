<script setup>
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useGeolocation } from '@/composables/useGeolocation'
import { REPORT_PHOTO, validatePhotoFile, validateReport } from '@/utils/validators'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'

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

async function fillMyLocation() {
  const position = await locate()
  if (!position) return
  form.latitude = position.latitude.toFixed(6)
  form.longitude = position.longitude.toFixed(6)
  delete localErrors.value.latitude
  delete localErrors.value.longitude
}

function onPickPhotos(event) {
  const picked = Array.from(event.target.files ?? [])
  event.target.value = '' // supaya file yang sama bisa dipilih lagi setelah dihapus

  const notices = []
  for (const file of picked) {
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
</script>

<template>
  <form class="report-form" novalidate @submit.prevent="onSubmit">
    <div class="field">
      <label for="report-description">Deskripsi laporan</label>
      <textarea
        id="report-description"
        v-model="form.description"
        class="control"
        rows="5"
        placeholder="Ceritakan apa yang terjadi, sejak kapan, dan dampaknya"
        :aria-invalid="!!shown.description"
      ></textarea>
      <span class="field__hint">{{ form.description.trim().length }}/2000</span>
      <span v-if="shown.description" class="field__error" role="alert">{{ shown.description }}</span>
    </div>

    <div class="field">
      <label for="report-subcategory">Jenis laporan</label>
      <select
        id="report-subcategory"
        v-model="form.subcategoryId"
        class="control"
        :aria-invalid="!!shown.subcategoryId"
      >
        <option value="">Pilih jenis laporan</option>
        <optgroup v-for="category in categories" :key="category.id" :label="category.name">
          <option v-for="sub in category.subcategories" :key="sub.id" :value="sub.id">
            {{ sub.name }}
          </option>
        </optgroup>
      </select>
      <span v-if="selectedAgency" class="field__hint">Ditangani oleh: {{ selectedAgency }}</span>
      <span v-if="shown.subcategoryId" class="field__error" role="alert">{{ shown.subcategoryId }}</span>
    </div>

    <fieldset class="group">
      <legend>Lokasi kejadian</legend>

      <BaseButton variant="secondary" :loading="locating" @click="fillMyLocation">
        Gunakan lokasi saya
      </BaseButton>
      <p v-if="geoError" class="field__error" role="alert">{{ geoError }}</p>

      <div class="group__row">
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
    </fieldset>

    <div class="field">
      <label for="report-photos">Foto</label>
      <input
        id="report-photos"
        class="control"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        :aria-invalid="!!(shown.photos || photoNotice)"
        @change="onPickPhotos"
      />
      <span class="field__hint">
        Minimal 1, maksimal {{ REPORT_PHOTO.maxFiles }} foto. Maksimal {{ REPORT_PHOTO.maxSizeMB }} MB per
        foto (JPG, PNG, atau WEBP).
      </span>
      <span v-if="photoNotice" class="field__error" role="alert">{{ photoNotice }}</span>
      <span v-if="shown.photos" class="field__error" role="alert">{{ shown.photos }}</span>

      <ul v-if="photos.length" class="previews">
        <li v-for="(photo, index) in photos" :key="photo.url" class="previews__item">
          <img :src="photo.url" :alt="`Pratinjau foto ${index + 1}`" />
          <button
            type="button"
            class="previews__remove"
            :aria-label="`Hapus foto ${index + 1}`"
            @click="removePhoto(index)"
          >
            &times;
          </button>
        </li>
      </ul>
    </div>

    <label class="check">
      <input v-model="form.isAnonymous" type="checkbox" />
      Sembunyikan identitasku (laporan anonim)
    </label>

    <BaseButton type="submit" :loading="loading">Kirim laporan</BaseButton>
  </form>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}
.field__hint { font-size: 0.8125rem; color: var(--color-text-muted); }
.field__error { color: #b91c1c; font-size: 0.875rem; }
.control[aria-invalid='true'] { border-color: #b91c1c; }

.group {
  margin: 0 0 1rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}
.group legend { padding: 0 0.25rem; }
.group__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-top: 1rem;
}

.previews {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 0.5rem 0 0;
  padding: 0;
  list-style: none;
}
.previews__item { position: relative; }
.previews__item img {
  display: block;
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
}
.previews__remove {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  width: 1.5rem;
  height: 1.5rem;
  border: 0;
  border-radius: 50%;
  background: #991b1b;
  color: #fff;
  line-height: 1;
  cursor: pointer;
}

.check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

@media (max-width: 480px) {
  .group__row { grid-template-columns: 1fr; }
}
</style>