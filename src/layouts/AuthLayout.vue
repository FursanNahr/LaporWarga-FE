<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { APP_CITY } from '@/constants/brand'
import { useSafeLink } from '@/composables/useSafeLink'
import AppLogo from '@/components/layout/AppLogo.vue'
import swirl from '@/assets/images/swirl.svg'
import illustrationMasuk from '@/assets/images/auth-illustration.svg'
import illustrationDaftar from '@/assets/images/auth-illustration-daftar.svg'

const link = useSafeLink()
const route = useRoute()

// Varian dipilih dari meta.authVariant di publik.routes.js. Default: 'masuk'.
const variant = computed(() => (route.meta.authVariant === 'daftar' ? 'daftar' : 'masuk'))
const illustration = computed(() => (variant.value === 'daftar' ? illustrationDaftar : illustrationMasuk))
const paragraph = computed(() =>
  variant.value === 'daftar'
    ? 'Laporkan masalah, dukung laporan warga lain, dan bantu wujudkan kota yang lebih nyaman untuk semua.'
    : `Laporkan permasalahan di sekitar, pantau progresnya secara transparan, dan berkontribusi untuk ${APP_CITY} yang lebih tertata bersama.`,
)
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-cream">
    <img :src="swirl" alt="" class="pointer-events-none absolute -top-10 left-0 w-full min-w-[900px] select-none" aria-hidden="true" />
    <!-- Bukit lime di pojok kanan bawah -->
    <div class="pointer-events-none absolute -bottom-40 -right-32 size-96 rounded-full bg-lime" aria-hidden="true"></div>

    <div class="relative mx-auto grid min-h-screen w-full max-w-[1280px] gap-8 px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
      <!-- Kiri: merek + pesan + ilustrasi (hanya di layar lebar) -->
      <div class="flex flex-col justify-between pt-8 lg:pb-0">
        <div>
          <RouterLink :to="link('beranda')" aria-label="Ke beranda" class="inline-block"><AppLogo /></RouterLink>

          <div class="mt-12 hidden lg:block">
            <svg viewBox="0 0 50 40" class="mb-2 h-10 w-12" fill="none" stroke="#44242d" stroke-width="3" stroke-linecap="round" aria-hidden="true">
              <path d="M8 34l8-10M20 28l4-16M32 30l12-8" />
            </svg>

            <p v-if="variant === 'daftar'" class="text-4xl font-extrabold leading-[1.1] tracking-tight xl:text-[3.25rem]">
              Bergabung Bersama<br />
              untuk {{ APP_CITY }}<br />
              yang <span class="inline-block -rotate-1 bg-lime px-2">Lebih Baik!</span>
            </p>
            <p v-else class="text-5xl font-extrabold leading-[1.05] tracking-tight xl:text-6xl">
              Suara Warga,<br />
              <span class="relative inline-block">
                Kota Lebih Baik
                <svg viewBox="0 0 400 14" preserveAspectRatio="none" class="absolute -bottom-2 left-0 h-3 w-full" fill="none" stroke="#c1f52f" stroke-width="5" stroke-linecap="round" aria-hidden="true">
                  <path d="M3 8c30-6 40 4 70 0s40-6 70 0 40 4 70 0 40-6 70 0 40 4 70 0 20-3 44-1" />
                </svg>
              </span>
            </p>

            <p class="mt-8 max-w-md leading-relaxed">{{ paragraph }}</p>
          </div>
        </div>

        <img :src="illustration" alt="" class="-ml-6 mt-6 hidden w-full max-w-xl lg:block" aria-hidden="true" />
      </div>

      <!-- Kanan: halaman (Masuk / Daftar) -->
      <main class="flex items-center justify-center pb-12 lg:py-12">
        <RouterView />
      </main>
    </div>
  </div>
</template>
