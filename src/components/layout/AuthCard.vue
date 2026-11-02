<script setup>
// Kartu berbingkai untuk halaman Masuk / Daftar.
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<template>
  <div class="relative w-full max-w-[34rem]">
    <svg viewBox="0 0 50 40" class="absolute -right-3 -top-8 hidden h-10 w-12 sm:block" fill="none" stroke="#44242d" stroke-width="3" stroke-linecap="round" aria-hidden="true">
      <path d="M12 30l-2-16M24 26l8-14M34 32l10-6" />
    </svg>
    <div class="rounded-[2rem] border border-maroon/40 bg-cream/90 px-6 py-8 backdrop-blur-sm sm:px-10 sm:py-10">
      <h1 class="text-2xl font-extrabold leading-tight sm:text-3xl">{{ title }}</h1>
      <p v-if="subtitle" class="mt-1.5 text-sm">{{ subtitle }}</p>
      <hr class="my-6 border-maroon/20" />
      <slot />
    </div>
  </div>
</template>
