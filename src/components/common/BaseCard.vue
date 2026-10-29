<script setup>
/** BaseCard: kotak berborder. `tag` untuk mengganti elemen (mis. "article" di dalam daftar). */
defineProps({
  tag: { type: String, default: 'div' },
})
</script>

<template>
  <component :is="tag" class="card"><slot /></component>
</template>

<style scoped>
.card {
  position: relative; /* dibutuhkan agar link "stretched" di dalam kartu bisa menutupi seluruh kartu */
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  overflow: hidden;
}
</style>