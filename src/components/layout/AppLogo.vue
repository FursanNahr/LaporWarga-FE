<script setup>
import { APP_NAME } from '@/constants/brand'
import logoUrl from '@/assets/images/logo.svg'


// Placeholder logo. Ganti isi <svg> dengan logo asli kalau sudah ada.
defineProps({
  size: { type: Number, default: 40 },
  showText: { type: Boolean, default: true },
})
</script>

<template>
  <span class="inline-flex items-center gap-2.5">
    <img
      :src="logoUrl"
      :width="size"
      :height="size"
      :alt="showText ? '' : APP_NAME"
      class="object-contain"
    />
    <span v-if="showText" class="text-xl font-extrabold tracking-tight text-maroon">{{ APP_NAME }}</span>
  </span>
</template>
