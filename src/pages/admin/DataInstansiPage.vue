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
  <section class="container admin-page">
    <header class="page-header">
      <div>
        <h1>Instansi &amp; petugas</h1>
        <p>Kelola instansi penanganan dan akun petugasnya. Akun dan instansi dinonaktifkan, tidak dihapus.</p>
      </div>
    </header>

    <div class="tabs" role="group" aria-label="Bagian">
      <button
        v-for="item in TABS"
        :key="item.key"
        type="button"
        class="tabs__tab"
        :class="{ 'is-active': tab === item.key }"
        :aria-pressed="tab === item.key"
        @click="tab = item.key"
      >
        {{ item.label }}
      </button>
    </div>

    <AgencySection v-if="tab === 'agency'" />
    <StaffSection v-else />
  </section>
</template>