<script setup>
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
</script>

<template>
  <div class="layout">
    <AppNavbar />

    <!-- Halaman (pages/publik/*) akan dirender di sini oleh vue-router -->
    <main class="layout__main">
      <RouterView />
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
/* flex: 1 supaya footer selalu menempel di bawah walau konten sedikit */
.layout__main { flex: 1; }
</style>