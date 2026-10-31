<script setup>
import { computed, ref, watch } from 'vue'
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
</script>

<template>
  <form novalidate @submit.prevent="submit">
    <p v-if="formError" class="alert alert--error" role="alert">{{ formError }}</p>

    <fieldset>
      <legend>Keputusan</legend>
      <label v-for="key in available" :key="key" class="radio">
        <input v-model="action" type="radio" name="verify-action" :value="key" />
        <span>
          <strong>{{ ACTIONS[key].label }}</strong>
          <small class="hint">{{ ACTIONS[key].hint }}</small>
        </span>
      </label>
    </fieldset>

    <div v-if="action === 'TERUSKAN'" class="field">
      <label for="verify-agency">Instansi tujuan</label>
      <select id="verify-agency" v-model="agencyId" class="control" :aria-invalid="!!fieldErrors.agencyId">
        <option value="" disabled>Pilih instansi</option>
        <option v-for="agency in activeAgencies" :key="agency.id" :value="agency.id">{{ agency.name }}</option>
      </select>
      <span v-if="fieldErrors.agencyId" class="field__error" role="alert">{{ fieldErrors.agencyId }}</span>
      <small class="hint">Sudah terisi sesuai jenis laporan. Ganti jika instansinya kurang tepat.</small>
    </div>

    <div v-if="action === 'TOLAK'" class="field">
      <label for="verify-reason">Alasan penolakan</label>
      <textarea
        id="verify-reason"
        v-model="reason"
        class="control"
        rows="3"
        maxlength="1000"
        :aria-invalid="!!fieldErrors.reason"
      ></textarea>
      <span v-if="fieldErrors.reason" class="field__error" role="alert">{{ fieldErrors.reason }}</span>
    </div>

    <div v-else class="field">
      <label for="verify-note">Catatan (opsional)</label>
      <textarea id="verify-note" v-model="note" class="control" rows="2" maxlength="2000"></textarea>
      <small class="hint">Masuk ke riwayat progres laporan.</small>
    </div>

    <BaseButton type="submit" :loading="submitting">{{ ACTIONS[action].label }}</BaseButton>
  </form>
</template>