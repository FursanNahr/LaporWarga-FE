<script setup>
/** BaseEmptyState: tampilan "tidak ada data". Slot default untuk tombol aksi (opsional). */
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>

<template>
  <div class="empty">
    <h3 class="empty__title">{{ title }}</h3>
    <p v-if="description" class="empty__text">{{ description }}</p>
    <div v-if="$slots.default" class="empty__action"><slot /></div>
  </div>
</template>

<style scoped>
.empty {
  padding: 2.5rem 1rem;
  text-align: center;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg-soft);
}
.empty__title { margin: 0 0 0.25rem; font-size: 1.125rem; }
.empty__text { margin: 0; color: var(--color-text-muted); }
.empty__action { margin-top: 1rem; }
</style>