<script setup>
import { computed, ref } from 'vue'
import { useSafeLink } from '@/composables/useSafeLink'
import AdminStats from '@/components/stats/AdminStats.vue'
import InstansiStats from '@/components/stats/InstansiStats.vue'
import WargaStats from '@/components/stats/WargaStats.vue'

const link = useSafeLink()

const tabs = [
  { key: 'warga', label: 'Warga', component: WargaStats },
  { key: 'instansi', label: 'Instansi', component: InstansiStats },
  { key: 'admin', label: 'Admin', component: AdminStats },
]
const activeTab = ref('warga')
const activeComponent = computed(() => tabs.find((tab) => tab.key === activeTab.value).component)

const ranges = [
  { key: 'bulan-ini', label: 'Bulan ini' },
  { key: '30-hari', label: '30 hari terakhir' },
  { key: 'semua', label: 'Semua waktu' },
]
const range = ref('30-hari')
const dateFrom = ref('')
const dateTo = ref('')

// Tanggal bebas menggantikan pilihan cepat. BE menyaring nilai kosong lewat stats.api.js.
const customActive = computed(() => Boolean(dateFrom.value || dateTo.value))
const params = computed(() => ({ range: range.value, dateFrom: dateFrom.value, dateTo: dateTo.value }))

function pickRange(key) {
  range.value = key
  dateFrom.value = ''
  dateTo.value = ''
}

const chip = (active) =>
  active ? 'bg-maroon text-white' : 'bg-sand text-maroon hover:bg-sand/70'
</script>

<template>
  <section class="mx-auto w-full max-w-[1120px] space-y-8 px-4 py-12">
    <header class="space-y-2">
      <h1 class="text-3xl font-extrabold">Statistik kinerja</h1>
      <p class="max-w-2xl">
        Seberapa aktif warga, secepat apa instansi menangani, dan seberapa cepat admin memverifikasi. Semua angka terbuka
        untuk publik.
      </p>
    </header>

    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div role="tablist" aria-label="Jenis statistik" class="flex gap-2">
        <button
          v-for="tab in tabs"
          :id="`tab-${tab.key}`"
          :key="tab.key"
          type="button"
          role="tab"
          :aria-selected="activeTab === tab.key"
          aria-controls="stats-panel"
          class="h-10 rounded-xl px-5 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
          :class="chip(activeTab === tab.key)"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="flex flex-wrap items-end gap-3">
        <div role="group" aria-label="Periode" class="flex flex-wrap gap-2">
          <button
            v-for="item in ranges"
            :key="item.key"
            type="button"
            :aria-pressed="!customActive && range === item.key"
            class="h-10 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
            :class="chip(!customActive && range === item.key)"
            @click="pickRange(item.key)"
          >
            {{ item.label }}
          </button>
        </div>

        <label class="text-xs font-semibold">
          Dari
          <input v-model="dateFrom" type="date" :max="dateTo || undefined" class="mt-1 block h-10 rounded-xl border border-maroon/25 bg-white px-3 text-sm font-normal" />
        </label>
        <label class="text-xs font-semibold">
          Sampai
          <input v-model="dateTo" type="date" :min="dateFrom || undefined" class="mt-1 block h-10 rounded-xl border border-maroon/25 bg-white px-3 text-sm font-normal" />
        </label>
      </div>
    </div>

    <div id="stats-panel" role="tabpanel" :aria-labelledby="`tab-${activeTab}`">
      <component :is="activeComponent" :key="activeTab" :params="params" />
    </div>

    <p class="text-sm">
      Ingin membandingkan instansi dan wilayah?
      <RouterLink :to="link('papan-transparansi')" class="font-bold text-maroon underline hover:text-maroon-dark">
        Buka Papan Transparansi
      </RouterLink>
    </p>
  </section>
</template>