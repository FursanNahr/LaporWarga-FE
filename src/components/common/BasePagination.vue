<script setup>
import BaseButton from '@/components/common/BaseButton.vue'

/**
 * BasePagination: kontrol untuk pagination cursor ("Muat lebih banyak").
 * Dipakai bersama composables/usePagination.js:
 *   <BasePagination :has-more="hasMore" :loading="loadingMore" @load-more="loadMore" />
 */
defineProps({
  hasMore: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})
defineEmits(['load-more'])
</script>

<template>
  <div v-if="hasMore" class="pagination">
    <BaseButton variant="secondary" :loading="loading" @click="$emit('load-more')">
      Muat lebih banyak
    </BaseButton>
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}
</style>