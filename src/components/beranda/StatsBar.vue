<script setup>
import { computed, onMounted, ref } from 'vue'
import { ArrowRight, Megaphone, CircleCheck, MapPin } from 'lucide-vue-next'
import { statsApi } from '@/api/stats.api'
import { useSafeLink } from '@/composables/useSafeLink'
import { formatNumber, formatPercent } from '@/utils/formatStats'

const link = useSafeLink()

// Jika API gagal, strip tetap tampil dengan '-' supaya beranda tidak berlubang.
const stats = ref(null)
onMounted(async () => {
  try {
    const { data: body } = await statsApi.overview()
    stats.value = body.data
  } catch {
    stats.value = null
  }
})

const items = computed(() => [
  {
    icon: Megaphone,
    value: stats.value ? formatNumber(stats.value.totalThisMonth) : '-',
    label: 'Total Laporan Bulan Ini',
  },
  {
    icon: CircleCheck,
    value: stats.value ? formatPercent(stats.value.onTimePercent) : '-',
    label: 'Terselesaikan Tepat Waktu',
  },
  {
    icon: MapPin,
    value: stats.value?.topDistrict?.name ?? '-',
    label: 'Kecamatan Teraktif',
  },
])
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
          <div class="min-w-0">
            <p class="break-words text-xl font-extrabold leading-tight">{{ item.value }}</p>
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