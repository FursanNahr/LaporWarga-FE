<script setup>
import { formatDateTime } from '@/utils/formatDate'

/** SlaTag: batas waktu tahap saat ini + penanda merah jika terlewat. sla = { dueAt, isOverdue }. */
defineProps({
  sla: { type: Object, default: null },
})
</script>

<template>
  <span v-if="!sla || !sla.dueAt" class="muted">-</span>
  <span v-else class="sla">
    <span v-if="sla.isOverdue" class="tag tag--danger">Terlewat</span>
    <span class="sla__due">{{ formatDateTime(sla.dueAt) }}</span>
  </span>
</template>

<style scoped>
.sla { display: grid; justify-items: start; gap: 0.125rem; }
.sla__due { font-size: 0.8125rem; color: var(--color-text-muted); }
</style>