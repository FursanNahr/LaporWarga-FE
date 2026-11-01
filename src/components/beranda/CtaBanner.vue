<script setup>
import { ArrowRight } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'
import { useSafeLink } from '@/composables/useSafeLink'
import { APP_CITY } from '@/constants/brand'
import gedung from '@/assets/images/gedung-banner.svg'

const link = useSafeLink()
const { isLoggedIn } = useAuth()
</script>

<template>
  <section class="relative overflow-hidden rounded-3xl bg-lime">
    <div class="relative grid items-center gap-6 px-6 py-8 sm:px-8 md:grid-cols-[1.2fr_auto_1fr]">
      <div>
        <h2 class="text-2xl font-extrabold leading-tight sm:text-3xl">Mari wujudkan {{ APP_CITY }}<br />yang lebih baik bersama!</h2>
        <p class="mt-3 text-sm">Laporkan, dukung, dan awasi penanganan laporan publik di sini.</p>
      </div>
      <RouterLink
        :to="isLoggedIn ? link('warga-buat-laporan') : link('daftar')"
        class="inline-flex h-12 items-center justify-center gap-2 justify-self-start rounded-xl bg-maroon px-6 text-sm font-bold text-white transition-colors hover:bg-maroon-dark md:justify-self-center"
      >
        Mulai Sekarang <ArrowRight class="size-4" aria-hidden="true" />
      </RouterLink>
      <img :src="gedung" alt="" class="hidden w-full max-w-xs justify-self-end md:block" aria-hidden="true" />
    </div>
  </section>
</template>
