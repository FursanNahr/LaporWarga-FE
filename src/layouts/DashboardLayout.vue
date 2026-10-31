<script setup>
import { computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { ROLES } from '@/constants/roles'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import '@/assets/styles/admin.css'

// Sidebar hanya untuk admin (menunya banyak). Warga dan instansi cukup memakai navbar.
const { role } = useAuth()
const hasSidebar = computed(() => role.value === ROLES.ADMIN)
</script>

<template>
  <div class="layout">
    <AppNavbar />

    <div class="layout__body" :class="{ 'layout__body--sidebar': hasSidebar }">
      <AppSidebar v-if="hasSidebar" class="layout__sidebar" />

      <!-- Halaman (pages/*) akan dirender di sini oleh vue-router -->
      <main class="layout__main">
        <RouterView />
      </main>
    </div>

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
.layout__body { flex: 1; display: flex; flex-direction: column; }
.layout__main { flex: 1; min-width: 0; }

.layout__sidebar { border-bottom: 1px solid var(--color-border); }

@media (min-width: 768px) {
  .layout__body--sidebar { flex-direction: row; }
  .layout__sidebar {
    flex: 0 0 15rem;
    border-right: 1px solid var(--color-border);
    border-bottom: 0;
  }
}
</style>