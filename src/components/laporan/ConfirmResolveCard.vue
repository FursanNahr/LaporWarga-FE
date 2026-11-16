<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { Check, CircleX, Info } from 'lucide-vue-next'
import { confirmationApi } from '@/api/confirmation.api'
import BaseModal from '@/components/common/BaseModal.vue'
import { useToast } from '@/composables/useToast'
import { formatDateTime } from '@/utils/formatDate'

/**
 * ConfirmResolveCard: "Apakah laporan ini sudah beres?"
 * Hanya dipasang untuk PELAPOR saat status MENUNGGU_KONFIRMASI (syaratnya dicek di
 * DetailLaporanPage lewat report.viewer.isOwner dan report.status).
 *
 * - "Sudah beres" : laporan ditutup (SELESAI). Catatan opsional.
 * - "Belum beres" : alasan (min. 10 karakter) + foto kondisi terkini (wajib, maks. 4).
 *                   Laporan masuk ke antrean admin yang memutuskan dibuka kembali atau ditutup.
 * - Tidak dijawab sampai batas waktu (report.confirmDueAt) : ditutup otomatis oleh sistem.
 *
 * Setelah berhasil memancarkan `changed` supaya halaman memuat ulang laporan.
 */
const props = defineProps({
  report: { type: Object, required: true },
})
const emit = defineEmits(['changed'])

const toast = useToast()

// Cermin batas di BE (config/constants.js dan confirmation.validator.js)
const MIN_REASON = 10
const MAX_NOTE = 1000
const MAX_PHOTOS = 4
const MAX_BYTES = 5 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const DAY_MS = 24 * 60 * 60 * 1000

const sending = ref(false)

// ---- Batas waktu konfirmasi ---------------------------------------------------------

const dueInfo = computed(() => {
  const raw = props.report.confirmDueAt
  if (!raw) return ''
  const due = new Date(raw)
  if (Number.isNaN(due.getTime())) return ''
  const days = Math.ceil((due.getTime() - Date.now()) / DAY_MS)
  if (days <= 0) return 'Batas konfirmasi sudah lewat. Laporan akan segera ditutup otomatis.'
  return `Beri konfirmasi sebelum ${formatDateTime(raw)} (${days} hari lagi). Jika tidak, laporan ditutup otomatis.`
})

// ---- Kirim ke BE --------------------------------------------------------------------

/** Mengembalikan true jika berhasil. Pesan error ditampilkan lewat toast. */
async function send(result, { note = '', photos = [] } = {}) {
  if (sending.value) return false
  sending.value = true
  try {
    const body = new FormData()
    body.append('result', result)
    if (note) body.append('note', note)
    photos.forEach((item) => body.append('photos', item.file))
    await confirmationApi.submit(props.report.id, body)
    return true
  } catch (e) {
    toast.error(e.normalized?.message ?? 'Gagal mengirim konfirmasi.')
    return false
  } finally {
    sending.value = false
  }
}

// ---- "Sudah beres" ------------------------------------------------------------------

const showDone = ref(false)
const doneNote = ref('')

async function confirmDone() {
  const ok = await send('SUDAH_BERES', { note: doneNote.value.trim() })
  if (!ok) return
  showDone.value = false
  doneNote.value = ''
  toast.success('Terima kasih, laporan telah ditutup.')
  emit('changed')
}

// ---- "Belum beres" ------------------------------------------------------------------

const showForm = ref(false)
const reason = ref('')
const photos = ref([]) // [{ id, file, url }]
const photoInput = ref(null)
const errors = ref({ reason: '', photo: '' })
let photoSeq = 0

function clearPhotos() {
  photos.value.forEach((item) => URL.revokeObjectURL(item.url))
  photos.value = []
}

function removePhoto(id) {
  const index = photos.value.findIndex((item) => item.id === id)
  if (index === -1) return
  const [removed] = photos.value.splice(index, 1)
  URL.revokeObjectURL(removed.url)
  errors.value.photo = ''
}

function onPick(event) {
  const picked = Array.from(event.target.files ?? [])
  event.target.value = '' // supaya file yang sama bisa dipilih lagi setelah dihapus
  errors.value.photo = ''

  for (const file of picked) {
    if (photos.value.length >= MAX_PHOTOS) {
      errors.value.photo = `Maksimal ${MAX_PHOTOS} foto.`
      break
    }
    if (!IMAGE_TYPES.includes(file.type)) {
      errors.value.photo = `${file.name}: format foto harus JPG, PNG, atau WEBP.`
      continue
    }
    if (file.size > MAX_BYTES) {
      errors.value.photo = `${file.name}: ukuran foto maksimal 5 MB.`
      continue
    }
    photos.value.push({ id: ++photoSeq, file, url: URL.createObjectURL(file) })
  }
}

function openForm() {
  errors.value = { reason: '', photo: '' }
  showForm.value = true
}

async function submitDispute() {
  const text = reason.value.trim()
  errors.value = {
    reason: text.length < MIN_REASON ? `Jelaskan minimal ${MIN_REASON} karakter.` : '',
    photo: photos.value.length === 0 ? 'Foto kondisi terkini wajib dilampirkan.' : '',
  }
  if (errors.value.reason || errors.value.photo) return

  const ok = await send('BELUM_BERES', { note: text, photos: photos.value })
  if (!ok) return
  showForm.value = false
  reason.value = ''
  clearPhotos()
  toast.success('Sanggahanmu terkirim dan menunggu keputusan admin.')
  emit('changed')
}

onBeforeUnmount(clearPhotos)
</script>

<template>
  <section class="rounded-3xl border border-sand-dark/70 bg-white/70 p-5" aria-labelledby="konfirmasi-title">
    <div class="flex items-center justify-between gap-3">
      <h2 id="konfirmasi-title" class="text-base font-extrabold">Apakah laporan ini sudah beres?</h2>
      <span
        class="shrink-0 text-maroon/70"
        title="Hanya kamu sebagai pelapor yang melihat ini. Kalau belum beres, sanggahanmu diteruskan ke admin yang memutuskan laporan dibuka kembali atau ditutup."
      >
        <Info class="size-5" aria-hidden="true" /><span class="sr-only">Informasi</span>
      </span>
    </div>

    <p class="mt-1.5 text-sm text-maroon/80">
      Instansi menyatakan laporan ini sudah selesai. Periksa hasilnya di lapangan lalu konfirmasi.
    </p>
    <p v-if="dueInfo" class="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">{{ dueInfo }}</p>

    <div class="mt-4 grid grid-cols-2 gap-3">
      <button
        type="button"
        class="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full border border-emerald-600 bg-emerald-50/60 text-sm font-bold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:cursor-wait disabled:opacity-60"
        :disabled="sending"
        @click="showDone = true"
      >
        <Check class="size-5" aria-hidden="true" /> Sudah Beres
      </button>
      <button
        type="button"
        class="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full border border-red-600 bg-red-50/60 text-sm font-bold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-wait disabled:opacity-60"
        :disabled="sending"
        @click="openForm"
      >
        <CircleX class="size-5" aria-hidden="true" /> Belum Beres
      </button>
    </div>

    <!-- Konfirmasi "Sudah beres": tindakan ini menutup laporan, jadi diminta sekali lagi -->
    <BaseModal v-model="showDone" title="Tutup laporan ini?">
      <div class="space-y-4">
        <p class="text-sm">
          Dengan menekan Kirim, kamu menyatakan hasil penanganan sudah sesuai. Laporan akan ditutup dan tidak dibuka lagi.
        </p>
        <div>
          <label for="done-note" class="text-sm font-bold">Catatan (opsional)</label>
          <textarea
            id="done-note"
            v-model="doneNote"
            rows="3"
            :maxlength="MAX_NOTE"
            placeholder="Contoh: jalan sudah rata, terima kasih."
            class="mt-1.5 w-full rounded-xl border border-sand-dark bg-white p-3 text-sm focus:border-maroon focus:outline-none"
          ></textarea>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="h-11 cursor-pointer rounded-full border border-sand-dark px-5 text-sm font-bold hover:bg-sand"
            @click="showDone = false"
          >Batal</button>
          <button
            type="button"
            class="h-11 cursor-pointer rounded-full bg-maroon px-5 text-sm font-bold text-white hover:bg-maroon-dark disabled:cursor-wait disabled:opacity-60"
            :disabled="sending"
            @click="confirmDone"
          >{{ sending ? 'Mengirim…' : 'Kirim' }}</button>
        </div>
      </template>
    </BaseModal>

    <!-- Form "Belum beres" -->
    <BaseModal v-model="showForm" title="Laporan belum beres">
      <div class="space-y-4">
        <div>
          <label for="dispute-reason" class="text-sm font-bold">Apa yang belum beres?</label>
          <textarea
            id="dispute-reason"
            v-model="reason"
            rows="4"
            :maxlength="MAX_NOTE"
            placeholder="Contoh: lubangnya baru ditambal sebagian dan masih berbahaya."
            class="mt-1.5 w-full rounded-xl border border-sand-dark bg-white p-3 text-sm focus:border-maroon focus:outline-none"
            :aria-invalid="Boolean(errors.reason)"
          ></textarea>
          <p v-if="errors.reason" class="mt-1 text-xs font-semibold text-red-700" role="alert">{{ errors.reason }}</p>
        </div>

        <div>
          <p class="text-sm font-bold">
            Foto kondisi terkini <span class="text-red-700">(wajib, maks. {{ MAX_PHOTOS }})</span>
          </p>
          <ul v-if="photos.length" class="mt-1.5 flex flex-wrap gap-3">
            <li v-for="item in photos" :key="item.id" class="relative">
              <img
                :src="item.url"
                alt="Pratinjau foto kondisi terkini"
                class="size-20 rounded-xl border border-sand-dark object-cover"
              />
              <button
                type="button"
                class="absolute -right-2 -top-2 grid size-6 cursor-pointer place-items-center rounded-full bg-maroon text-xs font-bold text-white"
                aria-label="Hapus foto"
                @click="removePhoto(item.id)"
              >×</button>
            </li>
          </ul>
          <button
            v-if="photos.length < MAX_PHOTOS"
            type="button"
            class="mt-2 h-10 cursor-pointer rounded-full border border-maroon px-4 text-sm font-bold hover:bg-sand"
            @click="photoInput.click()"
          >{{ photos.length ? 'Tambah foto' : 'Pilih foto' }}</button>
          <input
            ref="photoInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            class="hidden"
            @change="onPick"
          />
          <p v-if="errors.photo" class="mt-1 text-xs font-semibold text-red-700" role="alert">{{ errors.photo }}</p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="h-11 cursor-pointer rounded-full border border-sand-dark px-5 text-sm font-bold hover:bg-sand"
            @click="showForm = false"
          >Batal</button>
          <button
            type="button"
            class="h-11 cursor-pointer rounded-full bg-maroon px-5 text-sm font-bold text-white hover:bg-maroon-dark disabled:cursor-wait disabled:opacity-60"
            :disabled="sending"
            @click="submitDispute"
          >{{ sending ? 'Mengirim…' : 'Kirim sanggahan' }}</button>
        </div>
      </template>
    </BaseModal>
  </section>
</template>
