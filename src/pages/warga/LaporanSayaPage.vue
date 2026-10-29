<script setup>
import { onMounted, ref, watch } from 'vue'
import { laporanApi } from '@/api/laporan.api'
import { usePagination } from '@/composables/usePagination'
import { ALL_STATUSES } from '@/constants/status'
import { statusLabel } from '@/utils/formatStatus'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseEmptyState from '@/components/common/BaseEmptyState.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import LaporanCard from '@/components/laporan/LaporanCard.vue'

const status = ref('')
const { items, loading, loadingMore, error, hasMore, load, loadMore } = usePagination(laporanApi.mine)

onMounted(() => load({}))
watch(status, (value) => load({ status: value || undefined }))
</script>

<template>
  <section class="container page">
    <div class="page__head">
      <h1>Laporan Saya</h1>
      <RouterLink class="btn btn-primary" :to="{ name: 'warga-buat-laporan' }">Buat laporan</RouterLink>
    </div>

    <div class="page__filter">
      <label for="my-status">Status</label>
      <select id="my-status" v-model="status" class="control">
        <option value="">Semua status</option>
        <option v-for="value in ALL_STATUSES" :key="value" :value="value">{{ statusLabel(value) }}</option>
      </select>
    </div>

    <BaseLoading v-if="loading" />

    <template v-else-if="error && !items.length">
      <p class="form-alert" role="alert">{{ error }}</p>
      <BaseButton variant="secondary" @click="load()">Coba lagi</BaseButton>
    </template>

    <BaseEmptyState
      v-else-if="!items.length"
      title="Belum ada laporan"
      :description="status ? 'Tidak ada laporan dengan status ini.' : 'Laporan yang kamu buat akan muncul di sini.'"
    >
      <RouterLink v-if="!status" class="btn btn-primary" :to="{ name: 'warga-buat-laporan' }">
        Buat laporan pertama
      </RouterLink>
    </BaseEmptyState>

    <template v-else>
      <ul class="grid">
        <li v-for="report in items" :key="report.id"><LaporanCard :report="report" /></li>
      </ul>
      <p v-if="error" class="form-alert" role="alert">{{ error }}</p>
      <BasePagination :has-more="hasMore" :loading="loadingMore" @load-more="loadMore" />
    </template>
  </section>
</template>

<style scoped>
.page { padding-top: 2rem; padding-bottom: 2rem; }
.page__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.page__filter {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-width: 260px;
  margin-bottom: 1.5rem;
}
.page__filter label { font-size: 0.875rem; color: var(--color-text-muted); }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>