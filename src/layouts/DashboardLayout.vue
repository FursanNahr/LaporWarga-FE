<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import '@/assets/styles/admin.css'

/**
 * DashboardLayout: pembungkus halaman setelah login (warga, instansi, admin).
 * Sidebar di kiri (drawer di layar kecil), topbar + halaman + footer di kolom kanan.
 * Isi sidebar mengikuti role (lihat AppSidebar.vue).
 */
const route = useRoute()
const menuOpen = ref(false)

// Pindah halaman -> drawer menutup sendiri.
watch(() => route.fullPath, () => (menuOpen.value = false))
</script>

<template>
  <div class="flex min-h-dvh bg-cream">
    <AppSidebar :open="menuOpen" @close="menuOpen = false" />

    <div class="flex min-w-0 flex-1 flex-col">
      <AppTopbar :menu-open="menuOpen" @toggle-menu="menuOpen = !menuOpen" />

      <!-- Halaman (pages/*) dirender di sini oleh vue-router -->
      <main class="min-w-0 flex-1">
        <RouterView />
      </main>

      <AppFooter />
    </div>
  </div>
</template>