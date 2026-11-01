<script setup>
import { ArrowRight, Megaphone, CircleCheck, MapPin } from 'lucide-vue-next'
import { useSafeLink } from '@/composables/useSafeLink'
import { STATS_DUMMY } from '@/constants/berandaDummy' // TODO: ganti dengan data API stats

const link = useSafeLink()

const items = [
  { icon: Megaphone, value: STATS_DUMMY.totalBulanIni.toLocaleString('id-ID'), label: 'Total Laporan Bulan Ini' },
  { icon: CircleCheck, value: `${STATS_DUMMY.tepatWaktuPersen}%`, label: 'Terselesaikan Tepat Waktu' },
  { icon: MapPin, value: String(STATS_DUMMY.kecamatanAktif), label: 'Kecamatan Teraktif' },
]
</script>

<template>
  <section class="mx-auto w-full max-w-[1120px] px-4">
    <div class="flex flex-col gap-6 rounded-3xl bg-sand px-6 py-6 lg:flex-row lg:items-center lg:gap-8 lg:px-8">
      <p class="text-lg font-bold leading-snug lg:max-w-[12rem] lg:border-r lg:border-maroon/40 lg:pr-8">
        Bersama untuk Fasilitas Publik yang Lebih Baik
      </p>

      <ul class="grid flex-1 grid-cols-1 gap-5 sm:grid-cols-3">
        <li v-for="item in items" :key="item.label" class="flex items-center gap-3">
          <component :is="item.icon" class="size-9 shrink-0" stroke-width="1.8" aria-hidden="true" />
          <div>
            <p class="text-xl font-extrabold leading-none">{{ item.value }}</p>
            <p class="mt-1 text-xs leading-snug text-maroon/80">{{ item.label }}</p>
          </div>
        </li>
      </ul>

      <RouterLink
        :to="link('statistik')"
        class="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-maroon px-5 text-sm font-bold text-white transition-colors hover:bg-maroon-dark"
      >
        Lihat Statistik <ArrowRight class="size-4" aria-hidden="true" />
      </RouterLink>
    </div>
  </section>
</template>
