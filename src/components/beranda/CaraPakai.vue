<script setup>
import { ArrowRight, User, FilePlus2, MapPinned, Trophy } from 'lucide-vue-next'
import { APP_NAME } from '@/constants/brand'

const steps = [
  { icon: User, title: 'Login atau', sub: 'daftar akun' },
  { icon: FilePlus2, title: 'Buat Laporan', sub: 'isi form & unggah foto' },
  { code: 'BDG-2610-0042', title: 'Dapatkan', sub: 'Kode Tracking' },
  { icon: MapPinned, title: 'Pantau progres', sub: 'secara real-time' },
  { icon: Trophy, title: 'Berikan dukungan', sub: 'atau sanggahan jika perlu' },
]
</script>

<template>
  <section aria-labelledby="cara-heading">
    <div class="mb-5 flex items-center gap-2.5">
      <span class="size-3.5 rounded-full bg-lime" aria-hidden="true"></span>
      <h2 id="cara-heading" class="text-xl font-extrabold">Cara Menggunakan {{ APP_NAME }}</h2>
    </div>

    <ol class="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-2">
      <template v-for="(s, i) in steps" :key="s.title + i">
        <li class="relative flex flex-1 flex-col items-center rounded-2xl bg-sand px-3 pb-4 pt-7 text-center">
          <span class="absolute -top-3 flex size-7 items-center justify-center rounded-full bg-maroon text-xs font-bold text-white">{{ i + 1 }}</span>
          <span v-if="s.code" class="mb-2 rounded border border-maroon/60 bg-white px-2 py-1 text-[11px] font-semibold tracking-wide">{{ s.code }}</span>
          <component :is="s.icon" v-else class="mb-2 size-9" stroke-width="1.8" aria-hidden="true" />
          <p class="text-sm font-semibold leading-tight">{{ s.title }}</p>
          <p class="text-xs leading-tight text-maroon/80">{{ s.sub }}</p>
        </li>
        <li v-if="i < steps.length - 1" class="hidden text-maroon/60 md:block" aria-hidden="true"><ArrowRight class="size-4" /></li>
      </template>
    </ol>
  </section>
</template>
