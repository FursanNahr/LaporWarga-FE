<script setup>
import { useSafeLink } from '@/composables/useSafeLink'

const link = useSafeLink()
</script>

<template>
  <section class="mx-auto flex w-full max-w-[1120px] flex-col items-center px-4 py-24 text-center">
    <h1 class="text-3xl font-extrabold">Statistik segera hadir</h1>
    <p class="mt-3 max-w-md">Halaman ini sedang disiapkan. Sementara itu, lihat kinerja penanganan di Papan Transparansi.</p>
    <RouterLink :to="link('papan-transparansi')" class="mt-6 inline-flex h-11 items-center rounded-xl bg-maroon px-5 text-sm font-bold text-white hover:bg-maroon-dark">
      Buka Papan Transparansi
    </RouterLink>
  </section>
</template>
