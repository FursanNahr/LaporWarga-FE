<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | danger
  type: { type: String, default: 'button' },
  loading: { type: Boolean, default: false },
  block: { type: Boolean, default: false }, // lebar penuh
})

const VARIANTS = {
  primary: 'bg-maroon text-white hover:bg-maroon-dark',
  secondary: 'border-2 border-maroon text-maroon hover:bg-maroon hover:text-white',
  danger: 'bg-red-700 text-white hover:bg-red-800',
}
const variantClass = computed(() => VARIANTS[props.variant] ?? VARIANTS.secondary)
</script>

<template>
  <button
    :type="type"
    class="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full px-6 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
    :class="[variantClass, block && 'w-full']"
    :disabled="loading"
    :aria-busy="loading"
  >
    <slot v-if="!loading" />
    <span v-else>Memproses...</span>
  </button>
</template>
