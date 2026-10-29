<script setup>
/**
 * BaseBadge: label kecil berwarna.
 * variant: 'neutral' | 'primary' | 'info' | 'success' | 'warning' | 'danger'
 */
defineProps({
  variant: { type: String, default: 'neutral' },
})
</script>

<template>
  <span :class="['badge', `badge--${variant}`]"><slot /></span>
</template>

<style scoped>
.badge {
  display: inline-block;
  padding: 0.125rem 0.625rem;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.5;
  white-space: nowrap;
}
.badge--neutral { background: #e5e7eb; color: #374151; }
.badge--primary { background: #dbeafe; color: #1e40af; }
.badge--info { background: #e0f2fe; color: #075985; }
.badge--success { background: #dcfce7; color: #166534; }
.badge--warning { background: #fef3c7; color: #92400e; }
.badge--danger { background: #fee2e2; color: #991b1b; }
</style>