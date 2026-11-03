<script setup>
import { computed } from 'vue'
import { Check } from 'lucide-vue-next'
import { REPORT_STATUS } from '@/constants/status'

/**
 * ProgressSteps: timeline ringkas 4 tahap untuk kartu Laporan Saya.
 * Lingkaran berisi centang = tahap sudah selesai, lingkaran lime = tahap yang sedang berjalan.
 * Status DITOLAK tidak ditampilkan di sini (kartu menampilkan alasan penolakan).
 */
const props = defineProps({
  status: { type: String, required: true },
})

const STEPS = ['Menunggu Verifikasi', 'Diteruskan ke Instansi', 'Dalam Penanganan', 'Selesai']

// Jumlah tahap yang sudah selesai untuk tiap status.
const DONE_COUNT = {
  [REPORT_STATUS.MENUNGGU_VERIFIKASI]: 0,
  [REPORT_STATUS.TERVERIFIKASI]: 1,
  [REPORT_STATUS.DITERUSKAN]: 2,
  [REPORT_STATUS.DALAM_PENANGANAN]: 2,
  [REPORT_STATUS.SELESAI]: STEPS.length,
}

const done = computed(() => DONE_COUNT[props.status] ?? 0)

const stateOf = (index) => {
  if (index < done.value) return 'done'
  if (index === done.value) return 'current'
  return 'todo'
}

const CIRCLE_CLASS = {
  done: 'border-maroon bg-maroon text-white',
  current: 'border-maroon bg-lime',
  todo: 'border-sand-dark bg-cream',
}

const STATE_TEXT = {
  done: 'selesai',
  current: 'tahap saat ini',
  todo: 'belum',
}
</script>

<template>
  <ol class="flex" aria-label="Tahapan penanganan laporan">
    <li
      v-for="(label, index) in STEPS"
      :key="label"
      class="relative flex flex-1 flex-col items-center text-center"
    >
      <!-- Garis ke tahap berikutnya: gelap hanya jika kedua tahap sudah selesai -->
      <span
        v-if="index < STEPS.length - 1"
        class="absolute left-1/2 top-[11px] h-0.5 w-full"
        :class="index + 1 < done ? 'bg-maroon' : 'bg-sand-dark'"
        aria-hidden="true"
      />
      <span
        class="relative z-10 grid size-6 place-items-center rounded-full border-2"
        :class="CIRCLE_CLASS[stateOf(index)]"
      >
        <Check v-if="stateOf(index) === 'done'" class="size-3.5" :stroke-width="3" aria-hidden="true" />
      </span>
      <span class="mt-2 px-0.5 text-xs font-medium leading-tight text-maroon">
        {{ label }}
        <span class="sr-only">({{ STATE_TEXT[stateOf(index)] }})</span>
      </span>
    </li>
  </ol>
</template>