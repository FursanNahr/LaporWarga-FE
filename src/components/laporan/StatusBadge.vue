<script setup>
import BaseBadge from '@/components/common/BaseBadge.vue'
import { statusLabel, statusVariant } from '@/utils/formatStatus'

/** StatusBadge: BaseBadge untuk status laporan (label dan warna dari constants/status.js). */
defineProps({
  status: { type: String, required: true },
})
</script>

<template>
  <BaseBadge :variant="statusVariant(status)">{{ statusLabel(status) }}</BaseBadge>
</template>