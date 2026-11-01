<script setup>
import { APP_NAME } from '@/constants/brand'

// Placeholder logo. Ganti isi <svg> dengan logo asli kalau sudah ada.
defineProps({
  size: { type: Number, default: 40 },
  showText: { type: Boolean, default: true },
})
</script>

<template>
  <span class="inline-flex items-center gap-2.5">
    <svg :width="size" :height="size" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="#44242d" />
      <path d="M20 8.5l9.5 5.5v12L20 31.5 10.5 26V14z" fill="#c1f52f" />
      <path d="M16.5 15.5h7v9h-7z" fill="#44242d" />
    </svg>
    <span v-if="showText" class="text-xl font-extrabold tracking-tight text-maroon">{{ APP_NAME }}</span>
  </span>
</template>
