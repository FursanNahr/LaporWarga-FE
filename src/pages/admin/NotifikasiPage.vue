<script setup>
import NotifikasiList from '@/components/notifikasi/NotifikasiList.vue'

// Notifikasi admin (mis. SLA terlewat) membuka halaman detail laporan versi admin.
const reportRoute = (report) => ({ name: 'admin-detail-laporan', params: { id: report.id } })
</script>

<template>
  <section class="container admin-page">
    <header class="page-header"><h1>Notifikasi</h1></header>
    <NotifikasiList :report-route="reportRoute" />
  </section>
</template>