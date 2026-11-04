<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { CircleCheck, LoaderCircle, MapPin, RefreshCw, TriangleAlert } from 'lucide-vue-next'
import { instansiApi } from '@/api/instansi.api'
import { useGeolocation } from '@/composables/useGeolocation'
import { PROGRESS_ACTION, PROGRESS_ACTIONS, actionsForStatus } from '@/constants/status'
import { formatDistance } from '@/utils/formatStatus'
import { distanceInMeters } from '@/utils/geo'
import BaseButton from '@/components/common/BaseButton.vue'
import ProgressFileField from '@/components/laporan/ProgressFileField.vue'

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

// Hanya untuk tampilan panel radius di template (tidak dipakai logika kirim).
const radiusState = computed(() => {
  if (locating.value) return 'checking'
  if (coords.value) return withinRadius.value ? 'ok' : 'far'
  if (geoError.value) return 'error'
  return 'idle'
})
const RADIUS_TONE = {
  ok: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  far: 'border-red-300 bg-red-50 text-red-800',
  error: 'border-red-300 bg-red-50 text-red-800',
  checking: 'border-sand-dark bg-sand text-maroon',
  idle: 'border-sand-dark bg-sand text-maroon',
}

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
  <form class="space-y-6" novalidate @submit.prevent="submit">
    <!-- Pilihan aksi (hanya jika lebih dari satu), atau judul aksi tunggal -->
    <fieldset v-if="actions.length > 1" class="space-y-2">
      <legend class="mb-2 text-sm font-bold">Pilih tindakan</legend>
      <label
        v-for="item in actions"
        :key="item"
        class="flex cursor-pointer items-start gap-3 rounded-2xl border border-sand-dark bg-white p-4 transition-colors has-checked:border-maroon has-checked:bg-lime/20"
      >
        <input v-model="action" type="radio" name="progress-action" :value="item" class="mt-1 size-4 accent-maroon" />
        <span>
          <span class="block text-sm font-extrabold">{{ PROGRESS_ACTIONS[item].label }}</span>
          <span class="mt-0.5 block text-xs text-maroon/70">{{ PROGRESS_ACTIONS[item].description }}</span>
        </span>
      </label>
    </fieldset>
    <div v-else>
      <p class="text-lg font-extrabold">{{ submitLabel }}</p>
      <p class="mt-0.5 text-sm text-maroon/70">{{ PROGRESS_ACTIONS[action]?.description }}</p>
    </div>

    <!-- Catatan -->
    <div>
      <label for="progress-note" class="block text-sm font-bold">
        {{ noteRequired ? 'Catatan' : 'Catatan (opsional)' }}
      </label>
      <textarea
        id="progress-note"
        v-model="note"
        rows="4"
        placeholder="Tulis perkembangan penanganan di lapangan..."
        :aria-invalid="Boolean(fieldErrors.note)"
        class="mt-2 w-full resize-y rounded-2xl border border-sand-dark bg-white px-4 py-3 text-sm placeholder:text-maroon/40 focus:border-maroon aria-invalid:border-red-500"
      ></textarea>
      <p v-if="fieldErrors.note" class="mt-1 text-xs font-semibold text-red-700" role="alert">{{ fieldErrors.note }}</p>
    </div>

    <!-- Foto / berkas -->
    <div v-for="group in fileGroups" :key="group.key" class="space-y-3">
      <ProgressFileField
        :label="group.label"
        :hint="group.hint"
        :accept="group.accept"
        :multiple="group.multiple"
        :capture="group.capture"
        :items="files[group.key]"
        :disabled="submitting"
        @pick="addFiles(group.key, $event)"
        @remove="removeFile(group.key, $event)"
      />

      <!-- Status radius 100 m untuk foto sesudah -->
      <div
        v-if="group.key === 'afterPhotos'"
        class="flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 text-sm"
        :class="RADIUS_TONE[radiusState]"
        role="status"
        aria-live="polite"
      >
        <LoaderCircle v-if="radiusState === 'checking'" class="size-5 shrink-0 animate-spin" aria-hidden="true" />
        <CircleCheck v-else-if="radiusState === 'ok'" class="size-5 shrink-0" aria-hidden="true" />
        <TriangleAlert v-else-if="radiusState === 'far' || radiusState === 'error'" class="size-5 shrink-0" aria-hidden="true" />
        <MapPin v-else class="size-5 shrink-0" aria-hidden="true" />

        <p class="min-w-0 flex-1 font-medium">
          <template v-if="radiusState === 'checking'">Mencari lokasi Anda...</template>
          <template v-else-if="radiusState === 'ok'">
            Anda {{ formatDistance(distance) }} dari titik laporan, masih dalam radius {{ AFTER_PHOTO_RADIUS_M }} m.
          </template>
          <template v-else-if="radiusState === 'far'">
            Anda {{ formatDistance(distance) }} dari titik laporan. Dekati lokasi sampai maksimal {{ AFTER_PHOTO_RADIUS_M }} m.
          </template>
          <template v-else-if="radiusState === 'error'">{{ geoError }}</template>
          <template v-else>Lokasi dicek setelah foto dipilih. Radius yang diizinkan {{ AFTER_PHOTO_RADIUS_M }} m dari titik laporan.</template>
        </p>

        <button
          v-if="radiusState !== 'checking'"
          type="button"
          class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-current px-3 py-1.5 text-xs font-bold transition-opacity hover:opacity-70"
          @click="locate()"
        >
          <RefreshCw class="size-3.5" aria-hidden="true" />
          {{ radiusState === 'idle' ? 'Cek lokasi' : 'Perbarui lokasi' }}
        </button>
      </div>
    </div>

    <div class="space-y-3">
      <p class="text-xs text-maroon/60">{{ totalFiles }} dari {{ MAX_FILES }} file, maksimal {{ MAX_SIZE_MB }} MB per file.</p>
      <p v-if="fileError" class="text-xs font-semibold text-red-700" role="alert">{{ fileError }}</p>

      <!-- Untuk SELESAIKAN lokasi wajib dan dicek lewat panel radius di atas -->
      <label v-if="!isFinishing" class="flex cursor-pointer items-center gap-3 text-sm font-semibold">
        <input v-model="attachLocation" type="checkbox" class="size-4 accent-maroon" />
        Sertakan lokasi saya
      </label>
    </div>

    <p
      v-if="formError"
      class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
      role="alert"
    >
      {{ formError }}
    </p>

    <BaseButton type="submit" :loading="submitting" block>{{ submitLabel }}</BaseButton>
  </form>
</template>