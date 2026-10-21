<template>
  <footer class="footer">
    <div class="container footer__inner">
      <small>&copy; {{ new Date().getFullYear() }} LaporWarga</small>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-soft);
  color: var(--color-text-muted);
}
.footer__inner { padding: 1.5rem 1rem; }
</style>