<script setup>
/**
 * StatTile: satu angka dengan label. `alert` untuk angka yang perlu perhatian (misalnya SLA terlewat).
 * `hint` opsional: penjelasan singkat cara angka dihitung.
 */
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  hint: { type: String, default: '' },
  alert: { type: Boolean, default: false },
})
</script>

<template>
  <div
    class="rounded-2xl border px-5 py-4"
    :class="alert ? 'border-red-300 bg-red-50 text-red-800' : 'border-maroon/15 bg-white'"
  >
    <p class="text-2xl font-extrabold leading-none">{{ value }}</p>
    <p class="mt-2 text-sm font-semibold leading-snug">{{ label }}</p>
    <p v-if="hint" class="mt-1 text-xs leading-snug opacity-70">{{ hint }}</p>
  </div>
</template>