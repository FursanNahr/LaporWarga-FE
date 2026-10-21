<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

// Daftar menu dipisah dari template. Mau tambah menu? Cukup tambah satu baris di sini.
// `to` memakai NAME route (lihat router/routes/publik.routes.js), bukan path.
const menus = [
  { label: 'Beranda', to: { name: 'beranda' } },
  { label: 'Cari Laporan', to: { name: 'cari-laporan' } },
  { label: 'Papan Transparansi', to: { name: 'papan-transparansi' } },
]

const isOpen = ref(false) // state menu untuk tampilan mobile
const route = useRoute()

watch(() => route.fullPath, () => (isOpen.value = false))
</script>

<template>
  <header class="navbar">
    <nav class="container navbar__inner" aria-label="Navigasi utama">
      <RouterLink :to="{ name: 'beranda' }" class="navbar__brand">LaporWarga</RouterLink>

      <button
        class="navbar__toggle"
        type="button"
        :aria-expanded="isOpen"
        aria-controls="navbar-menu"
        aria-label="Buka menu"
        @click="isOpen = !isOpen"
      >
        <span></span><span></span><span></span>
      </button>

      <ul id="navbar-menu" class="navbar__menu" :class="{ 'is-open': isOpen }">
        <li v-for="menu in menus" :key="menu.label">
          <RouterLink :to="menu.to" class="navbar__link">{{ menu.label }}</RouterLink>
        </li>
        <li>
          <RouterLink :to="{ name: 'masuk' }" class="btn btn-primary">Masuk</RouterLink>
        </li>
      </ul>
    </nav>
  </header>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 40;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}
.navbar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--navbar-height);
}
.navbar__brand {
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--color-primary);
}
.navbar__menu {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.navbar__link {
  color: var(--color-text-muted);
  padding: 0.25rem 0;
  border-bottom: 2px solid transparent;
}
.navbar__link:hover { color: var(--color-text); }

/* Class ini otomatis dipasang vue-router pada link yang sedang aktif */
.navbar__link.router-link-exact-active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.navbar__toggle {
  display: none;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: none;
  border: 0;
  cursor: pointer;
}
.navbar__toggle span {
  width: 22px;
  height: 2px;
  background: var(--color-text);
}

/* Tampilan mobile */
@media (max-width: 768px) {
  .navbar__toggle { display: flex; }
  .navbar__menu {
    display: none;
    position: absolute;
    top: var(--navbar-height);
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
  }
  .navbar__menu.is-open { display: flex; }
}
</style>