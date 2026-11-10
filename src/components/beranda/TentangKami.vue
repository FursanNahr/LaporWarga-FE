<script setup>
import { Camera, Check, Eye, MapPin, ShieldCheck, Users } from 'lucide-vue-next'
import { APP_CITY, APP_NAME } from '@/constants/brand'

const principles = [
  { icon: Eye, title: 'Transparan', desc: 'Setiap tahap penanganan tampil terbuka, lengkap dengan foto sebelum dan sesudah.' },
  { icon: Users, title: 'Partisipatif', desc: 'Warga bisa mendukung, memverifikasi, dan menyanggah hasil penanganan.' },
  { icon: ShieldCheck, title: 'Akuntabel', desc: 'Batas waktu penanganan terlihat publik dan setiap perubahan status tercatat permanen.' },
]

const timeline = [
  { label: 'Terverifikasi', done: true },
  { label: 'Dalam penanganan', done: true },
  { label: 'Menunggu konfirmasi pelapor', done: false },
]
</script>

<template>
  <section aria-labelledby="tentang-heading">
    <div class="mb-5 flex items-center gap-2.5">
      <span class="size-3.5 rounded-full bg-lime" aria-hidden="true"></span>
      <h2 id="tentang-heading" class="text-xl font-extrabold">Tentang {{ APP_NAME }}</h2>
    </div>

    <div class="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
      <!-- Teks & prinsip -->
      <div>
        <h3 class="text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
          Aduanmu terlihat,<br />
          <span class="relative inline-block">
            prosesnya terbuka.
            <svg viewBox="0 0 400 14" preserveAspectRatio="none" class="absolute -bottom-2 left-0 h-3 w-full" fill="none" stroke="#c1f52f" stroke-width="5" stroke-linecap="round" aria-hidden="true">
              <path d="M3 8c30-6 40 4 70 0s40-6 70 0 40 4 70 0 40-6 70 0 40 4 70 0 20-3 44-1" />
            </svg>
          </span>
        </h3>

        <p class="mt-6 max-w-lg text-base leading-relaxed">
          {{ APP_NAME }} adalah wadah warga {{ APP_CITY }} untuk melaporkan masalah di sekitar dan memantau penanganannya
          langkah demi langkah. Tidak ada laporan yang hilang tanpa jejak: semua bisa dilihat, dinilai, dan dikawal bersama.
        </p>

        <ul class="mt-7 space-y-3">
          <li
            v-for="p in principles"
            :key="p.title"
            class="flex items-start gap-4 rounded-2xl bg-sand px-4 py-3.5 transition-transform hover:-translate-y-0.5"
          >
            <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-lime text-maroon-dark">
              <component :is="p.icon" class="size-5" stroke-width="2" aria-hidden="true" />
            </span>
            <div>
              <p class="font-bold leading-tight">{{ p.title }}</p>
              <p class="mt-0.5 text-sm leading-snug text-maroon/80">{{ p.desc }}</p>
            </div>
          </li>
        </ul>
      </div>

      <!-- Kolase -->
      <div class="relative mx-auto w-full max-w-md pb-10 lg:max-w-none lg:pl-4">
        <div class="relative overflow-hidden rounded-3xl bg-maroon p-6 text-white sm:p-8">
          <span class="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-lime" aria-hidden="true"></span>
          <span class="pointer-events-none absolute -bottom-16 -left-10 size-40 rounded-full bg-lime/20" aria-hidden="true"></span>
          <svg viewBox="0 0 50 40" class="pointer-events-none absolute right-5 top-5 h-9 w-11" fill="none" stroke="#44242d" stroke-width="3" stroke-linecap="round" aria-hidden="true">
            <path d="M8 34l8-10M20 28l4-16M32 30l12-8" />
          </svg>

          <div class="relative">
            <p class="text-xs font-semibold uppercase tracking-widest text-white/70">Kode tracking</p>
            <span class="mt-2 inline-block rounded-lg bg-white px-3 py-1.5 text-sm font-extrabold tracking-wide text-maroon">BDG-2610-0042</span>

            <ol class="mt-7 space-y-0">
              <li v-for="(t, i) in timeline" :key="t.label" class="relative flex gap-4 pb-6 last:pb-0">
                <span
                  v-if="i < timeline.length - 1"
                  class="absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-0.5 bg-white/30"
                  aria-hidden="true"
                ></span>
                <span
                  class="relative flex size-7 shrink-0 items-center justify-center rounded-full"
                  :class="t.done ? 'bg-lime text-maroon-dark' : 'border-2 border-dashed border-white/60'"
                >
                  <Check v-if="t.done" class="size-4" stroke-width="3" aria-hidden="true" />
                </span>
                <p class="pt-0.5 text-sm font-semibold" :class="t.done ? '' : 'text-white/80'">{{ t.label }}</p>
              </li>
            </ol>
          </div>
        </div>

        <div class="absolute -bottom-0 right-2 flex max-w-[15rem] -rotate-3 items-center gap-3 rounded-2xl bg-white px-4 py-3 text-maroon shadow-[0_12px_30px_-10px_rgba(68,36,45,.35)] sm:right-6">
          <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-sand">
            <Camera class="size-5" aria-hidden="true" />
          </span>
          <p class="text-sm font-semibold leading-tight">Foto "sesudah" wajib diambil dalam radius 100 m.</p>
        </div>

        <div class="absolute -left-1 bottom-4 hidden rotate-[4deg] items-center gap-2 rounded-xl bg-lime px-3 py-2 text-xs font-bold text-maroon-dark shadow-[0_12px_30px_-10px_rgba(68,36,45,.35)] sm:flex">
          <MapPin class="size-4" aria-hidden="true" /> Untuk {{ APP_CITY }}
        </div>
      </div>
    </div>
  </section>
</template>
