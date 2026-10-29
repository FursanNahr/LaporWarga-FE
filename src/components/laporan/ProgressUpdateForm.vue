<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { instansiApi } from '@/api/instansi.api'
import { useGeolocation } from '@/composables/useGeolocation'
import { PROGRESS_ACTION, PROGRESS_ACTIONS, actionsForStatus } from '@/constants/status'
import { formatDistance } from '@/utils/formatStatus'
import { distanceInMeters } from '@/utils/geo'
import BaseButton from '@/components/common/BaseButton.vue'

/**
 * ProgressUpdateForm: petugas memperbarui progres laporan (POST /reports/:id/progress).
 * `report` = detail laporan dari GET /reports/:id (butuh id, status, latitude, longitude).
 * Setelah berhasil, memancarkan `updated` supaya halaman induk memuat ulang laporan.
 */
const props = defineProps({
  report: { type: Object, required: true },
})
const emit = defineEmits(['updated'])

// Cermin batas di BE (config/constants.js)
const AFTER_PHOTO_RADIUS_M = 100
const MAX_FILES = 5 // total semua field dalam satu request
const MAX_SIZE_MB = 10
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const DOCUMENT_TYPES = [...IMAGE_TYPES, 'application/pdf']
const ALLOWED_TYPES = { photos: IMAGE_TYPES, afterPhotos: IMAGE_TYPES, documents: DOCUMENT_TYPES }

// Di HP (layar sentuh) foto sesudah wajib dari kamera. Di desktop sementara boleh pilih file.
const preferCamera =
  typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true

// ---- Aksi ----------------------------------------------------------------
const actions = computed(() => actionsForStatus(props.report.status))
const action = ref(actions.value[0] ?? '')
watch(actions, (list) => {
  if (!list.includes(action.value)) action.value = list[0] ?? ''
})

const isFinishing = computed(() => action.value === PROGRESS_ACTION.SELESAIKAN)
const noteRequired = computed(() => action.value === PROGRESS_ACTION.TAMBAH_CATATAN)
const note = ref('')

// ---- Lokasi ----------------------------------------------------------------
const { coords, loading: locating, error: geoError, locate } = useGeolocation()
const attachLocation = ref(true) // untuk SELESAIKAN selalu dikirim (wajib)
const needsLocation = computed(() => isFinishing.value || attachLocation.value)

const distance = computed(() =>
  coords.value ? Math.round(distanceInMeters(coords.value, props.report)) : null,
)
const withinRadius = computed(
  () => distance.value !== null && distance.value <= AFTER_PHOTO_RADIUS_M,
)

// ---- File ------------------------------------------------------------------
const files = reactive({ photos: [], afterPhotos: [], documents: [] })
const fileError = ref('')
let fileSeq = 0

const totalFiles = computed(
  () => files.photos.length + files.afterPhotos.length + files.documents.length,
)

const fileGroups = computed(() => [
  {
    key: 'photos',
    label: 'Foto progres',
    hint: 'Opsional. Foto kondisi di lapangan selama penanganan.',
    accept: 'image/*',
    multiple: true,
  },
  ...(isFinishing.value
    ? [
        {
          key: 'afterPhotos',
          label: 'Foto sesudah (wajib)',
          hint: preferCamera
            ? `Ambil langsung dengan kamera, dalam radius ${AFTER_PHOTO_RADIUS_M} m dari titik laporan.`
            : `Diambil dalam radius ${AFTER_PHOTO_RADIUS_M} m dari titik laporan. Waktu foto dicatat server.`,
          accept: 'image/*',
          capture: preferCamera ? 'environment' : undefined,
          multiple: !preferCamera,
        },
      ]
    : []),
  {
    key: 'documents',
    label: 'Berkas pendukung',
    hint: 'Opsional. PDF, JPG, PNG, atau WEBP.',
    accept: 'image/*,application/pdf',
    multiple: true,
  },
])

function addFiles(group, event) {
  const picked = Array.from(event.target.files ?? [])
  event.target.value = '' // supaya file yang sama bisa dipilih lagi setelah dihapus
  fileError.value = ''

  for (const file of picked) {
    if (totalFiles.value >= MAX_FILES) {
      fileError.value = `Maksimal ${MAX_FILES} file per pembaruan.`
      break
    }
    if (!ALLOWED_TYPES[group].includes(file.type)) {
      fileError.value = `${file.name}: format tidak didukung.`
      continue
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      fileError.value = `${file.name}: ukuran melebihi ${MAX_SIZE_MB} MB.`
      continue
    }
    files[group].push({
      id: ++fileSeq,
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
    })
  }

  // Lokasi diambil saat foto sesudah dipilih, supaya mewakili tempat foto diambil.
  if (group === 'afterPhotos' && picked.length > 0) locate()
}

function removeFile(group, id) {
  const index = files[group].findIndex((item) => item.id === id)
  if (index === -1) return
  const [removed] = files[group].splice(index, 1)
  if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl)
  fileError.value = ''
}

function clearFiles(group) {
  files[group].forEach((item) => item.previewUrl && URL.revokeObjectURL(item.previewUrl))
  files[group].splice(0)
}

const clearAllFiles = () => Object.keys(files).forEach(clearFiles)
onBeforeUnmount(clearAllFiles)

// Pindah aksi: foto sesudah hanya berlaku untuk SELESAIKAN (BE menolak jika dikirim di aksi lain).
watch(action, (value) => {
  fileError.value = ''
  if (value === PROGRESS_ACTION.SELESAIKAN) locate()
  else clearFiles('afterPhotos')
})

// ---- Kirim -----------------------------------------------------------------
const submitting = ref(false)
const formError = ref('')
const fieldErrors = ref({})

const submitLabel = computed(() => PROGRESS_ACTIONS[action.value]?.label ?? 'Kirim')

function resetForm() {
  note.value = ''
  clearAllFiles()
  fileError.value = ''
}

async function submit() {
  if (submitting.value || !action.value) return
  formError.value = ''
  fieldErrors.value = {}

  const noteText = note.value.trim()
  if (noteRequired.value && !noteText) {
    fieldErrors.value = { note: 'Catatan wajib diisi.' }
    return
  }
  if (isFinishing.value && files.afterPhotos.length === 0) {
    formError.value = 'Foto sesudah wajib diunggah untuk menyelesaikan laporan.'
    return
  }

  let position = null
  if (needsLocation.value) {
    // SELESAIKAN memakai lokasi saat foto dipilih; aksi lain mengambil lokasi terbaru.
    position = isFinishing.value ? (coords.value ?? (await locate())) : await locate()
    if (!position) {
      formError.value = isFinishing.value
        ? geoError.value || 'Lokasi tidak tersedia.'
        : `${geoError.value || 'Lokasi tidak tersedia.'} Hilangkan centang "Sertakan lokasi saya" jika tidak ingin melampirkan lokasi.`
      return
    }
    if (isFinishing.value) {
      const meters = Math.round(distanceInMeters(position, props.report))
      if (meters > AFTER_PHOTO_RADIUS_M) {
        formError.value = `Anda ${formatDistance(meters)} dari titik laporan. Foto sesudah harus diambil dalam radius ${AFTER_PHOTO_RADIUS_M} m.`
        return
      }
    }
  }

  const body = new FormData()
  body.append('action', action.value)
  if (noteText) body.append('note', noteText)
  if (position) {
    body.append('latitude', position.latitude)
    body.append('longitude', position.longitude)
  }
  for (const group of ['photos', 'afterPhotos', 'documents']) {
    files[group].forEach((item) => body.append(group, item.file))
  }

  submitting.value = true
  try {
    await instansiApi.kirimProgress(props.report.id, body)
    resetForm()
    emit('updated')
  } catch (e) {
    formError.value = e.normalized?.message ?? 'Gagal mengirim pembaruan.'
    fieldErrors.value = e.normalized?.fieldErrors ?? {}
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="progress-form" novalidate @submit.prevent="submit">
    <fieldset v-if="actions.length > 1" class="progress-form__actions">
      <legend>Pilih tindakan</legend>
      <label v-for="key in actions" :key="key" class="progress-form__option">
        <input v-model="action" type="radio" name="progress-action" :value="key" />
        <span>
          <strong>{{ PROGRESS_ACTIONS[key].label }}</strong>
          <small>{{ PROGRESS_ACTIONS[key].description }}</small>
        </span>
      </label>
    </fieldset>
    <p v-else-if="action" class="progress-form__single">
      <strong>{{ PROGRESS_ACTIONS[action].label }}</strong>
      <small>{{ PROGRESS_ACTIONS[action].description }}</small>
    </p>

    <div class="field">
      <label for="progress-note">Catatan{{ noteRequired ? ' (wajib)' : ' (opsional)' }}</label>
      <textarea
        id="progress-note"
        v-model="note"
        class="control"
        rows="4"
        maxlength="2000"
        :aria-invalid="!!fieldErrors.note"
        :aria-describedby="fieldErrors.note ? 'progress-note-error' : undefined"
      ></textarea>
      <span v-if="fieldErrors.note" id="progress-note-error" class="field__error" role="alert">
        {{ fieldErrors.note }}
      </span>
    </div>

    <div v-for="group in fileGroups" :key="group.key" class="field">
      <label :for="`progress-file-${group.key}`">{{ group.label }}</label>
      <small class="progress-form__hint">{{ group.hint }}</small>
      <input
        :id="`progress-file-${group.key}`"
        class="control"
        type="file"
        :accept="group.accept"
        :capture="group.capture"
        :multiple="group.multiple"
        :disabled="totalFiles >= MAX_FILES || submitting"
        @change="addFiles(group.key, $event)"
      />

      <ul v-if="files[group.key].length" class="previews">
        <li v-for="item in files[group.key]" :key="item.id" class="previews__item">
          <img v-if="item.previewUrl" :src="item.previewUrl" :alt="item.file.name" />
          <span v-else class="previews__doc">{{ item.file.name }}</span>
          <button
            type="button"
            class="previews__remove"
            :aria-label="`Hapus ${item.file.name}`"
            :disabled="submitting"
            @click="removeFile(group.key, item.id)"
          >
            &times;
          </button>
        </li>
      </ul>
    </div>

    <p v-if="fileError" class="progress-form__error" role="alert">{{ fileError }}</p>
    <small class="progress-form__hint">
      {{ totalFiles }} dari {{ MAX_FILES }} file, maksimal {{ MAX_SIZE_MB }} MB per file.
    </small>

    <div v-if="isFinishing" class="location" :class="{ 'location--ok': withinRadius, 'location--far': distance !== null && !withinRadius }">
      <p v-if="locating" role="status">Mencari lokasi Anda...</p>
      <p v-else-if="distance !== null" role="status">
        Jarak Anda dari titik laporan: <strong>{{ formatDistance(distance) }}</strong>
        (batas {{ AFTER_PHOTO_RADIUS_M }} m).
        {{ withinRadius ? 'Anda berada dalam jangkauan.' : 'Dekati lokasi laporan sebelum mengambil foto.' }}
      </p>
      <p v-else-if="geoError" role="alert">{{ geoError }}</p>
      <p v-else>Lokasi akan diambil saat Anda memilih foto sesudah.</p>
      <button type="button" class="btn" :disabled="locating" @click="locate">Perbarui lokasi</button>
    </div>
    <label v-else class="progress-form__check">
      <input v-model="attachLocation" type="checkbox" />
      Sertakan lokasi saya
    </label>
    <span v-if="fieldErrors.latitude" class="field__error" role="alert">{{ fieldErrors.latitude }}</span>

    <p v-if="formError" class="progress-form__error" role="alert">{{ formError }}</p>

    <BaseButton type="submit" :loading="submitting">{{ submitLabel }}</BaseButton>
  </form>
</template>

<style scoped>
.progress-form {
  display: grid;
  gap: 1rem;
}
.progress-form__actions {
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  border: 0;
}
.progress-form__actions legend {
  margin-bottom: 0.5rem;
  font-weight: 600;
}
.progress-form__option {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  cursor: pointer;
}
.progress-form__option span,
.progress-form__single {
  display: grid;
  gap: 0.125rem;
}
.progress-form__single { margin: 0; }
.progress-form small,
.progress-form__hint {
  color: var(--color-text-muted);
}
.progress-form__hint { display: block; margin-bottom: 0.25rem; }
.progress-form__check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.progress-form__error {
  margin: 0;
  color: var(--color-danger, #b91c1c);
}

.location {
  display: grid;
  gap: 0.5rem;
  justify-items: start;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}
.location p { margin: 0; }
.location--ok { border-color: var(--color-success, #15803d); }
.location--far { border-color: var(--color-danger, #b91c1c); }

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
  height: 72px;
  object-fit: cover;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}
.previews__doc {
  display: block;
  max-width: 160px;
  padding: 0.5rem 1.5rem 0.5rem 0.5rem;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 0.875rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.previews__remove {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  width: 1.5rem;
  height: 1.5rem;
  line-height: 1;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-bg);
  cursor: pointer;
}
</style>