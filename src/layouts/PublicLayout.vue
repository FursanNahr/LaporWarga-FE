<script setup>
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppNavbar />
    <!-- Halaman (pages/publik/*) dirender di sini oleh vue-router -->
    <main class="flex-1">
      <RouterView />
    </main>
    <AppFooter />
  </div>
</template>
