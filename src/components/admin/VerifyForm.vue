<script setup>
import { computed, ref, watch } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { adminApi } from '@/api/admin.api'
import { REPORT_STATUS } from '@/constants/status'
import BaseButton from '@/components/common/BaseButton.vue'

/**
 * VerifyForm: admin memverifikasi, menolak, atau meneruskan laporan (POST /admin/reports/:id/verification).
 * `report` = detail laporan (butuh id, status, agency). `agencies` = daftar instansi dari master data.
 * Memancarkan `updated` setelah berhasil, supaya halaman induk memuat ulang laporannya.
 */
const props = defineProps({
  report: { type: Object, required: true },
  agencies: { type: Array, default: () => [] },
})
const emit = defineEmits(['updated'])

const ACTIONS = {
  VERIFIKASI: {
    label: 'Verifikasi',
    hint: 'Laporan dinyatakan valid. Bisa diteruskan ke instansi setelahnya.',
  },
  TERUSKAN: {
    label: 'Teruskan ke instansi',
    hint: 'Petugas instansi langsung mendapat laporan ini. Jika belum diverifikasi, otomatis diverifikasi dulu.',
  },
  TOLAK: {
    label: 'Tolak',
    hint: 'Alasan penolakan akan terlihat oleh pelapor, dan keputusan ini tidak bisa dibatalkan.',
  },
}

const available = computed(() =>
  props.report.status === REPORT_STATUS.MENUNGGU_VERIFIKASI
    ? ['VERIFIKASI', 'TERUSKAN', 'TOLAK']
    : ['TERUSKAN', 'TOLAK'],
)
const action = ref(available.value[0])
watch(available, (list) => {
  if (!list.includes(action.value)) action.value = list[0]
})

const agencyId = ref(props.report.agency?.id ?? '')
watch(
  () => props.report.agency?.id,
  (id) => (agencyId.value = id ?? ''),
)
const activeAgencies = computed(() => props.agencies.filter((agency) => agency.isActive))

const reason = ref('')
const note = ref('')
const submitting = ref(false)
const formError = ref('')
const fieldErrors = ref({})

async function submit() {
  if (submitting.value) return
  formError.value = ''
  fieldErrors.value = {}

  const body = { action: action.value }
  if (action.value === 'TOLAK') {
    if (reason.value.trim().length < 5) {
      fieldErrors.value = { reason: 'Alasan minimal 5 karakter.' }
      return
    }
    body.reason = reason.value.trim()
  } else if (note.value.trim()) {
    body.note = note.value.trim()
  }
  if (action.value === 'TERUSKAN') {
    if (!agencyId.value) {
      fieldErrors.value = { agencyId: 'Pilih instansi tujuan.' }
      return
    }
    body.agencyId = Number(agencyId.value)
  }

  submitting.value = true
  try {
    await adminApi.verifikasi(props.report.id, body)
    reason.value = ''
    note.value = ''
    emit('updated', action.value)
  } catch (e) {
    formError.value = e.normalized?.message ?? 'Gagal memperbarui laporan.'
    fieldErrors.value = e.normalized?.fieldErrors ?? {}
  } finally {
    submitting.value = false
  }
}

// Gaya (Tailwind, token moodboard)
const labelClass = 'mb-1.5 block text-sm font-semibold text-maroon'
const controlClass =
  'w-full rounded-2xl border border-sand-dark bg-cream px-4 py-2.5 text-sm text-maroon placeholder:text-maroon/50 focus:border-maroon focus:outline-none focus:ring-2 focus:ring-lime aria-[invalid=true]:border-red-500'
</script>

<template>
  <form novalidate class="grid gap-5" @submit.prevent="submit">
    <p v-if="formError" class="rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-800" role="alert">{{ formError }}</p>

    <fieldset class="m-0 grid gap-2.5 border-0 p-0">
      <legend :class="labelClass">Keputusan</legend>
      <label
        v-for="key in available"
        :key="key"
        class="flex cursor-pointer items-start gap-3 rounded-2xl border border-sand-dark bg-cream px-4 py-3 transition-colors hover:bg-sand has-[:checked]:border-maroon has-[:checked]:bg-lime/20 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-maroon"
      >
        <input v-model="action" type="radio" name="verify-action" :value="key" class="mt-1 h-4 w-4 accent-maroon" />
        <span class="grid gap-0.5">
          <strong class="text-sm font-extrabold text-maroon">{{ ACTIONS[key].label }}</strong>
          <small class="text-sm text-maroon/70">{{ ACTIONS[key].hint }}</small>
        </span>
      </label>
    </fieldset>

    <div v-if="action === 'TERUSKAN'">
      <label for="verify-agency" :class="labelClass">Instansi tujuan</label>
      <div class="relative">
        <select
          id="verify-agency"
          v-model="agencyId"
          :class="[controlClass, 'appearance-none rounded-full pr-10']"
          :aria-invalid="!!fieldErrors.agencyId"
        >
          <option value="" disabled>Pilih instansi</option>
          <option v-for="agency in activeAgencies" :key="agency.id" :value="agency.id">{{ agency.name }}</option>
        </select>
        <ChevronDown class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-maroon/60" aria-hidden="true" />
      </div>
      <span v-if="fieldErrors.agencyId" class="mt-1 block text-sm text-red-700" role="alert">{{ fieldErrors.agencyId }}</span>
      <small class="mt-1 block text-sm text-maroon/70">Sudah terisi sesuai jenis laporan. Ganti jika instansinya kurang tepat.</small>
    </div>

    <div v-if="action === 'TOLAK'">
      <label for="verify-reason" :class="labelClass">Alasan penolakan</label>
      <textarea
        id="verify-reason"
        v-model="reason"
        :class="controlClass"
        rows="3"
        maxlength="1000"
        :aria-invalid="!!fieldErrors.reason"
      ></textarea>
      <span v-if="fieldErrors.reason" class="mt-1 block text-sm text-red-700" role="alert">{{ fieldErrors.reason }}</span>
    </div>

    <div v-else>
      <label for="verify-note" :class="labelClass">Catatan (opsional)</label>
      <textarea id="verify-note" v-model="note" :class="controlClass" rows="2" maxlength="2000"></textarea>
      <small class="mt-1 block text-sm text-maroon/70">Masuk ke riwayat progres laporan.</small>
    </div>

    <BaseButton type="submit" class="justify-self-start" :variant="action === 'TOLAK' ? 'danger' : 'primary'" :loading="submitting">
      {{ ACTIONS[action].label }}
    </BaseButton>
  </form>
</template>