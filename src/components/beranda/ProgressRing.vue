<script setup>
import { computed } from 'vue'

// value: 0-100 (panjang busur). Teks di tengah lewat slot.
const props = defineProps({
  value: { type: Number, required: true },
  size: { type: Number, default: 96 },
})
const r = 42
const circumference = 2 * Math.PI * r
const dash = computed(() => `${(Math.min(Math.max(props.value, 0), 100) / 100) * circumference} ${circumference}`)
</script>

<template>
  <div class="relative" :style="{ width: `${size}px`, height: `${size}px` }">
    <svg viewBox="0 0 100 100" class="size-full -rotate-90" aria-hidden="true">
      <circle cx="50" cy="50" :r="r" fill="none" stroke="#efe5da" stroke-width="9" />
      <circle cx="50" cy="50" :r="r" fill="none" stroke="#c1f52f" stroke-width="9" stroke-linecap="round" :stroke-dasharray="dash" />
    </svg>
    <div class="absolute inset-0 flex items-center justify-center text-lg font-extrabold"><slot /></div>
  </div>
</template>
