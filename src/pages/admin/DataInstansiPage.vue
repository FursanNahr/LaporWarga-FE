<script setup>
import { ref } from 'vue'
import AgencySection from '@/components/admin/AgencySection.vue'
import StaffSection from '@/components/admin/StaffSection.vue'

const TABS = [
  { key: 'agency', label: 'Instansi' },
  { key: 'staff', label: 'Akun petugas' },
]
const tab = ref(TABS[0].key)
</script>

<template>
  <section class="mx-auto w-full max-w-[1400px] px-5 py-8 lg:px-8">
    <header>
      <h1 class="text-4xl font-extrabold tracking-tight text-maroon sm:text-5xl">
        <span class="relative inline-block">
          Instansi
          <svg
            class="absolute -bottom-1.5 left-0 h-2.5 w-full"
            viewBox="0 0 200 12"
            preserveAspectRatio="none"
            fill="none"
            aria-hidden="true"
          >
            <path d="M2 8C45 2 120 2 198 7" stroke="#c1f52f" stroke-width="4" stroke-linecap="round" />
          </svg>
        </span>
        &amp; Petugas
      </h1>
      <p class="mt-3 max-w-2xl text-lg text-maroon/80">
        Kelola instansi penanganan dan akun petugasnya. Akun dan instansi dinonaktifkan, tidak dihapus.
      </p>
    </header>

    <div role="group" aria-label="Bagian" class="mt-8 flex flex-wrap gap-2">
      <button
        v-for="item in TABS"
        :key="item.key"
        type="button"
        class="h-11 cursor-pointer rounded-full px-5 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
        :class="tab === item.key ? 'bg-maroon text-white' : 'bg-sand text-maroon hover:bg-sand-dark/60'"
        :aria-pressed="tab === item.key"
        @click="tab = item.key"
      >
        {{ item.label }}
      </button>
    </div>

    <div class="mt-6">
      <AgencySection v-if="tab === 'agency'" />
      <StaffSection v-else />
    </div>
  </section>
</template>