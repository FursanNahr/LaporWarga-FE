<script setup>
import { ArrowRight, MapPin } from 'lucide-vue-next'
import { useSafeLink } from '@/composables/useSafeLink'
import { TRANSPARANSI_DUMMY as t } from '@/constants/berandaDummy' // TODO: ganti dengan API transparansi
import ProgressRing from '@/components/beranda/ProgressRing.vue'

const link = useSafeLink()
// Cincin "rata-rata hari" hanya visual: makin cepat, makin penuh (skala 10 hari).
const speed = Math.round((1 - Math.min(t.rataHari, 10) / 10) * 100)
</script>

<template>
  <aside class="rounded-3xl bg-sand p-5">
    <div class="flex items-center gap-2">
      <span class="size-3.5 rounded-full bg-lime" aria-hidden="true"></span>
      <h2 class="text-base font-extrabold">Transparansi Penanganan</h2>
    </div>
    <p class="mt-2 text-xs font-semibold">Papan Transparansi Satpol PP &amp; Dishub</p>

    <div class="mt-5 grid grid-cols-2 gap-3 text-center">
      <div class="flex flex-col items-center gap-2">
        <ProgressRing :value="t.persenSelesai"><span>{{ t.persenSelesai }}%</span></ProgressRing>
        <p class="text-xs leading-tight">Tingkat<br />Penyelesaian</p>
      </div>
      <div class="flex flex-col items-center gap-2">
        <ProgressRing :value="speed">
          <span class="text-base">{{ t.rataHari }} <small class="text-xs font-bold">Hari</small></span>
        </ProgressRing>
        <p class="text-xs leading-tight">Rata-rata<br />Penanganan</p>
      </div>
    </div>

    <div class="mt-6 border-t border-maroon/20 pt-4">
      <p class="text-sm font-bold">Laporan Paling Sering</p>
      <p class="mt-2 flex items-center gap-2 text-sm"><MapPin class="size-5" aria-hidden="true" /> {{ t.lokasiSering }}</p>
    </div>

    <RouterLink
      :to="link('papan-transparansi')"
      class="mt-4 flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-maroon text-sm font-bold transition-colors hover:bg-maroon hover:text-white"
    >
      Lihat Detail <ArrowRight class="size-4" aria-hidden="true" />
    </RouterLink>
  </aside>
</template>
