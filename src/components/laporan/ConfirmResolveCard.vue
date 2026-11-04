<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { Check, CircleX, Info } from 'lucide-vue-next'
import BaseModal from '@/components/common/BaseModal.vue'
import { useToast } from '@/composables/useToast'

/**
 * ConfirmResolveCard: "Apakah laporan ini sudah beres?" Hanya dipasang untuk PELAPOR saat status SELESAI
 * (syaratnya dicek di DetailLaporanPage lewat report.viewer.isOwner).
 *
 * - "Sudah beres"  -> konfirmasi langsung.
 * - "Belum beres"  -> modal: alasan + foto kondisi terkini (wajib). BE seharusnya membuka kembali laporan.
 *
 * DUMMY: endpoint konfirmasi belum ada. Hasilnya hanya tampil di kartu ini dan hilang saat halaman
 * dimuat ulang. Ganti isi `sendConfirmation` dengan pemanggilan API (lalu emit 'changed' supaya halaman
 * memuat ulang laporan) dan set LIVE = true untuk menghapus catatan "belum tersambung".
 */
defineProps({
  report: { type: Object, required: true },
})
const emit = defineEmits(['changed'])

const LIVE = false // DUMMY
const toast = useToast()

const result = ref(null) // null | 'confirmed' | 'disputed'
const sending = ref(false)

// DUMMY: confirmationApi.confirm(report.id) atau confirmationApi.dispute(report.id, formData)
async function sendConfirmation() {
  await new Promise((resolve) => setTimeout(resolve, 600))
}

async function confirmDone() {
  if (sending.value) return
  sending.value = true
  try {
    await sendConfirmation()
    result.value = 'confirmed'
    toast.success('Terima kasih, konfirmasimu sudah dicatat.')
    if (LIVE) emit('changed')
  } catch (e) {
    toast.error(e.normalized?.message ?? 'Gagal mengirim konfirmasi.')
  } finally {
    sending.value = false
  }
}

// ---- Form "Belum beres" -----------------------------------------------------------

const MIN_REASON = 10
const MAX_BYTES = 5 * 1024 * 1024
const showForm = ref(false)
const reason = ref('')
const photo = ref(null) // { file, url }
const photoInput = ref(null)
const errors = ref({ reason: '', photo: '' })

function clearPhoto() {
  if (photo.value) URL.revokeObjectURL(photo.value.url)
  photo.value = null
}

function onPick(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    errors.value.photo = 'Lampiran harus berupa foto.'
    return
  }
  if (file.size > MAX_BYTES) {
    errors.value.photo = 'Ukuran foto maksimal 5 MB.'
    return
  }
  clearPhoto()
  photo.value = { file, url: URL.createObjectURL(file) }
  errors.value.photo = ''
}

function openForm() {
  errors.value = { reason: '', photo: '' }
  showForm.value = true
}

async function submitDispute() {
  errors.value = {
    reason: reason.value.trim().length < MIN_REASON ? `Jelaskan minimal ${MIN_REASON} karakter.` : '',
    photo: photo.value ? '' : 'Foto kondisi terkini wajib dilampirkan.',
  }
  if (errors.value.reason || errors.value.photo || sending.value) return

  sending.value = true
  try {
    await sendConfirmation()
    showForm.value = false
    result.value = 'disputed'
    toast.success('Sanggahanmu sudah dicatat.')
    if (LIVE) emit('changed')
  } catch (e) {
    toast.error(e.normalized?.message ?? 'Gagal mengirim sanggahan.')
  } finally {
    sending.value = false
  }
}

onBeforeUnmount(clearPhoto)
</script>

<template>
  <section class="rounded-3xl border border-sand-dark/70 bg-white/70 p-5" aria-labelledby="konfirmasi-title">
    <div v-if="!result">
      <div class="flex items-center justify-between gap-3">
        <h2 id="konfirmasi-title" class="text-base font-extrabold">Apakah laporan ini sudah beres?</h2>
        <span
          class="shrink-0 text-maroon/70"
          title="Hanya kamu sebagai pelapor yang melihat ini. Kalau belum beres, laporan dibuka kembali dan instansi harus menjawab."
        >
          <Info class="size-5" aria-hidden="true" /><span class="sr-only">Informasi</span>
        </span>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          class="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full border border-emerald-600 bg-emerald-50/60 text-sm font-bold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:cursor-wait disabled:opacity-60"
          :disabled="sending"
          @click="confirmDone"
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
    </div>

    <div v-else role="status">
      <h2 id="konfirmasi-title" class="text-base font-extrabold">
        {{ result === 'confirmed' ? 'Terima kasih sudah mengonfirmasi' : 'Sanggahanmu sudah dicatat' }}
      </h2>
      <p class="mt-1 text-sm">
        {{
          result === 'confirmed'
            ? 'Laporan ini kami tandai sudah beres menurutmu.'
            : 'Laporan akan dibuka kembali dan instansi diminta menjawab sanggahanmu.'
        }}
      </p>
    </div>

    <p v-if="!LIVE" class="mt-3 text-[11px] text-maroon/60">Mode contoh: belum tersambung ke server.</p>

    <BaseModal v-model="showForm" title="Laporan belum beres">
      <div class="space-y-4">
        <div>
          <label for="dispute-reason" class="text-sm font-bold">Apa yang belum beres?</label>
          <textarea
            id="dispute-reason"
            v-model="reason"
            rows="4"
            maxlength="500"
            placeholder="Contoh: lubangnya baru ditambal sebagian dan masih berbahaya."
            class="mt-1.5 w-full rounded-xl border border-sand-dark bg-white p-3 text-sm focus:border-maroon focus:outline-none"
            :aria-invalid="Boolean(errors.reason)"
          ></textarea>
          <p v-if="errors.reason" class="mt-1 text-xs font-semibold text-red-700" role="alert">{{ errors.reason }}</p>
        </div>

        <div>
          <p class="text-sm font-bold">Foto kondisi terkini <span class="text-red-700">(wajib)</span></p>
          <div class="mt-1.5 flex items-center gap-3">
            <img v-if="photo" :src="photo.url" alt="Pratinjau foto kondisi terkini" class="size-20 rounded-xl border border-sand-dark object-cover" />
            <button
              type="button"
              class="h-10 cursor-pointer rounded-full border border-maroon px-4 text-sm font-bold hover:bg-sand"
              @click="photoInput.click()"
            >{{ photo ? 'Ganti foto' : 'Pilih foto' }}</button>
            <input ref="photoInput" type="file" accept="image/*" class="hidden" @change="onPick" />
          </div>
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