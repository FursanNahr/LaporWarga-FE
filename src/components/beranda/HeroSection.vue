<script setup>
import { ArrowRight, Check } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'
import { useSafeLink } from '@/composables/useSafeLink'
import { APP_NAME, APP_CITY } from '@/constants/brand'
import swirl from '@/assets/images/swirl.svg'
// Ganti file ini dengan foto asli (mis. hero-gedung-sate.jpg) lalu ubah import-nya.
import heroPhoto from '@/assets/images/hero-photo.svg'

const link = useSafeLink()
const { isLoggedIn } = useAuth()
</script>

<template>
  <section class="relative overflow-hidden">
    <img :src="swirl" alt="" class="pointer-events-none absolute inset-x-0 top-0 -z-0 w-full min-w-[900px] select-none" aria-hidden="true" />

    <div class="relative mx-auto grid w-full max-w-[1120px] items-center gap-10 px-4 pb-16 pt-6 lg:grid-cols-[1.15fr_1fr] lg:pb-20 lg:pt-10">
      <div>
        <div class="relative inline-block">
          <span class="inline-block rounded-lg bg-lime px-3 py-1 text-xl font-extrabold tracking-tight">{{ APP_NAME }}</span>
          <svg viewBox="0 0 40 30" class="absolute -right-12 -top-5 h-8 w-10" fill="none" stroke="#44242d" stroke-width="3" stroke-linecap="round" aria-hidden="true">
            <path d="M6 24l5-8M16 20l3-12M26 22l9-6" />
          </svg>
        </div>

        <h1 class="mt-3 text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.1rem]">
          Suara Warga,<br />
          <span class="relative inline-block">
            Kota Lebih Baik
            <svg viewBox="0 0 400 14" preserveAspectRatio="none" class="absolute -bottom-2 left-0 h-3 w-full" fill="none" stroke="#c1f52f" stroke-width="5" stroke-linecap="round" aria-hidden="true">
              <path d="M3 8c30-6 40 4 70 0s40-6 70 0 40 4 70 0 40-6 70 0 40 4 70 0 20-3 44-1" />
            </svg>
          </span>
        </h1>

        <p class="mt-7 max-w-md text-base leading-relaxed sm:text-lg">
          Laporkan permasalahan di sekitar, pantau progresnya secara transparan, dan berkontribusi untuk {{ APP_CITY }} yang lebih tertata bersama.
        </p>

        <div class="mt-8 flex flex-wrap gap-3">
          <RouterLink
            :to="isLoggedIn ? link('warga-buat-laporan') : link('masuk')"
            class="inline-flex h-12 items-center gap-2 rounded-xl bg-maroon px-6 text-sm font-bold text-white transition-colors hover:bg-maroon-dark"
          >
            Buat Laporan <ArrowRight class="size-4" aria-hidden="true" />
          </RouterLink>
          <RouterLink
            :to="link('feed')"
            class="inline-flex h-12 items-center rounded-xl border-2 border-maroon px-6 text-sm font-bold transition-colors hover:bg-maroon hover:text-white"
          >
            Jelajahi Feed
          </RouterLink>
        </div>
      </div>

      <!-- Foto ala polaroid -->
      <div class="relative mx-auto w-full max-w-md lg:max-w-none lg:pl-6">
        <svg viewBox="0 0 50 40" class="absolute -top-6 left-4 hidden h-10 w-12 sm:block" fill="none" stroke="#44242d" stroke-width="3" stroke-linecap="round" aria-hidden="true">
          <path d="M8 34l8-10M20 28l4-16M32 30l12-8" />
        </svg>
        <div class="rotate-[4deg] rounded-md bg-white p-3 shadow-[0_18px_40px_-12px_rgba(68,36,45,.35)]">
          <img :src="heroPhoto" alt="Gedung Sate, Bandung" class="aspect-[4/3] w-full rounded-sm object-cover" />
        </div>
        <div class="absolute -bottom-5 right-0 flex -rotate-3 items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_12px_30px_-10px_rgba(68,36,45,.35)] sm:right-4">
          <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"><Check class="size-5" aria-hidden="true" /></span>
          <p class="text-sm font-semibold leading-tight">Laporan Anda<br />terpantau transparan!</p>
        </div>
      </div>
    </div>
  </section>
</template>
