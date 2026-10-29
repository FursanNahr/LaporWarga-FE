<script setup>
defineProps({
  text: { type: String, default: 'Memuat...' },
})
</script>

<template>
  <div class="loading" role="status" aria-live="polite">
    <span class="loading__spinner" aria-hidden="true"></span>
    <span>{{ text }}</span>
  </div>
</template>

<style scoped>
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem 1rem;
  color: var(--color-text-muted);
}
.loading__spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (prefers-reduced-motion: reduce) {
  .loading__spinner { animation-duration: 2.4s; }
}
</style>