<script setup>
import { onMounted, ref } from 'vue'
import { laporanApi } from '@/api/laporan.api'
import { masterApi } from '@/api/master.api'
import { usePagination } from '@/composables/usePagination'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseEmptyState from '@/components/common/BaseEmptyState.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import LaporanCard from '@/components/laporan/LaporanCard.vue'
import LaporanFilter from '@/components/laporan/LaporanFilter.vue'

const categories = ref([])
const filtered = ref(false) // true kalau ada filter aktif (untuk teks "tidak ada hasil")
const { items, loading, loadingMore, error, hasMore, load, loadMore } = usePagination(laporanApi.list)

function onFilter(params) {
  filtered.value = Object.keys(params).length > 0
  load(params)
}

onMounted(async () => {
  load({})
  // Daftar jenis hanya untuk dropdown filter; kalau gagal, filter jenis disembunyikan saja
  try {
    const { data: body } = await masterApi.categories()
    categories.value = body.data
  } catch {
    categories.value = []
  }
})
</script>

<template>
  <section class="container page">
    <h1>Cari Laporan</h1>
    <p class="page__lead">Telusuri laporan warga yang sudah terverifikasi.</p>

    <LaporanFilter :categories="categories" @change="onFilter" />

    <BaseLoading v-if="loading" />

    <template v-else-if="error && !items.length">
      <p class="form-alert" role="alert">{{ error }}</p>
      <BaseButton variant="secondary" @click="load()">Coba lagi</BaseButton>
    </template>

    <BaseEmptyState
      v-else-if="!items.length"
      title="Laporan tidak ditemukan"
      :description="filtered ? 'Coba ubah kata kunci atau filter.' : 'Belum ada laporan yang tampil.'"
    />

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
.page__lead { margin-top: 0; color: var(--color-text-muted); }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>