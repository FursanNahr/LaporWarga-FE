<script setup>
import { ref } from 'vue'
import { confirmationApi } from '@/api/confirmation.api'
import BaseButton from '@/components/common/BaseButton.vue'

/**
 * DisputeDecisionForm: admin memutuskan sanggahan pelapor (PATCH /admin/disputes/:id/resolve).
 *  - REOPEN : laporan kembali ke Dalam Penanganan, instansi menangani ulang, SLA dihitung ulang.
 *  - CLOSE  : laporan ditutup (Selesai) sesuai keputusan admin.
 * Alasan wajib (min. 10 karakter) dan tampil di riwayat serta dikirim ke pelapor dan instansi.
 *
 * Memancarkan `resolved` (dengan nilai 'REOPEN' | 'CLOSE') setelah berhasil.
 */
const props = defineProps({
  reportId: { type: Number, required: true },
  trackingCode: { type: String, default: '' },
})
const emit = defineEmits(['resolved'])

// Cermin batas di BE (confirmation.validator.js)
const MIN_REASON = 10
const MAX_REASON = 1000

const OPTIONS = [
  {
    value: 'REOPEN',
    label: 'Buka kembali',
    description: 'Status kembali ke Dalam Penanganan. Instansi menangani ulang dan SLA dihitung ulang.',
  },
  {
    value: 'CLOSE',
    label: 'Tutup laporan',
    description: 'Status menjadi Selesai sesuai keputusan admin. Pelapor dan instansi diberi tahu.',
  },
]

const decision = ref('')
const reason = ref('')
const submitting = ref(false)
const errors = ref({ decision: '', reason: '', form: '' })

async function submit() {
  if (submitting.value) return
  const text = reason.value.trim()
  errors.value = {
    decision: decision.value ? '' : 'Pilih keputusan terlebih dahulu.',
    reason: text.length < MIN_REASON ? `Alasan minimal ${MIN_REASON} karakter.` : '',
    form: '',
  }
  if (errors.value.decision || errors.value.reason) return

  submitting.value = true
  try {
    await confirmationApi.resolveDispute(props.reportId, { decision: decision.value, reason: text })
    const chosen = decision.value
    reason.value = ''
    decision.value = ''
    emit('resolved', chosen)
  } catch (e) {
    errors.value.form = e.normalized?.message ?? 'Gagal menyimpan keputusan.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="submit">
    <fieldset class="space-y-2">
      <legend class="mb-1 text-sm font-bold">
        Keputusan<template v-if="trackingCode"> untuk {{ trackingCode }}</template>
      </legend>
      <label
        v-for="option in OPTIONS"
        :key="option.value"
        class="flex cursor-pointer items-start gap-3 rounded-2xl border border-sand-dark bg-white p-4 transition-colors has-checked:border-maroon has-checked:bg-lime/20"
      >
        <input v-model="decision" type="radio" :name="`decision-${reportId}`" :value="option.value" class="mt-1 size-4 accent-maroon" />
        <span>
          <span class="block text-sm font-extrabold">{{ option.label }}</span>
          <span class="mt-0.5 block text-xs text-maroon/70">{{ option.description }}</span>
        </span>
      </label>
      <p v-if="errors.decision" class="text-xs font-semibold text-red-700" role="alert">{{ errors.decision }}</p>
    </fieldset>

    <div>
      <label :for="`decision-reason-${reportId}`" class="block text-sm font-bold">Alasan keputusan</label>
      <textarea
        :id="`decision-reason-${reportId}`"
        v-model="reason"
        rows="3"
        :maxlength="MAX_REASON"
        placeholder="Jelaskan dasar keputusan. Alasan ini tampil di riwayat laporan."
        :aria-invalid="Boolean(errors.reason)"
        class="mt-2 w-full resize-y rounded-2xl border border-sand-dark bg-white px-4 py-3 text-sm placeholder:text-maroon/40 focus:border-maroon aria-invalid:border-red-500"
      ></textarea>
      <p v-if="errors.reason" class="mt-1 text-xs font-semibold text-red-700" role="alert">{{ errors.reason }}</p>
    </div>

    <p
      v-if="errors.form"
      class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
      role="alert"
    >
      {{ errors.form }}
    </p>

    <BaseButton type="submit" :loading="submitting" block>Simpan keputusan</BaseButton>
  </form>
</template>
