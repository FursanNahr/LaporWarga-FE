<script setup>
import NotifikasiList from '@/components/notifikasi/NotifikasiList.vue'

// Petugas membuka halaman kelola progres dari notifikasi.
const reportRoute = (report) => ({ name: 'instansi-kelola-progress', params: { id: report.id } })
</script>

<template>
  <section class="container page">
    <h1>Notifikasi</h1>
    <NotifikasiList :report-route="reportRoute" />
  </section>
</template>

<style scoped>
.page { padding-block: 1.5rem; }
</style>