<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, X } from 'lucide-vue-next'
import { laporanApi } from '@/api/laporan.api'
import { masterApi } from '@/api/master.api'
import { usePagination } from '@/composables/usePagination'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseEmptyState from '@/components/common/BaseEmptyState.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import LaporanFilter from '@/components/laporan/LaporanFilter.vue'
import LaporanSearchCard from '@/components/laporan/LaporanSearchCard.vue'

const route = useRoute()
const router = useRouter()

const categories = ref([])
const { items, loading, loadingMore, error, hasMore, load, loadMore } = usePagination(laporanApi.list)

// ---- Kata kunci: berasal dari kolom cari di navbar lewat ?q= ----
const keyword = computed(() => (typeof route.query.q === 'string' ? route.query.q.trim() : ''))
// BE menolak kata kunci < 2 karakter, jadi yang dikirim hanya yang valid
const searchTerm = computed(() => (keyword.value.length >= 2 ? keyword.value : ''))

// ---- Filter dari chip status dan dropdown (sudah bersih dari LaporanFilter) ----
const filterParams = ref({})
const hasActiveFilter = computed(() => !!searchTerm.value || Object.keys(filterParams.value).length > 0)

const reload = () => load({ ...filterParams.value, q: searchTerm.value || undefined })

function onFilter(params) {
  filterParams.value = params
  reload()
}

// Navbar mengubah ?q= tanpa memuat ulang halaman ini, jadi pantau perubahannya
watch(searchTerm, () => {
  if (route.name === 'cari-laporan') reload() // jangan muat ulang saat pengguna sedang pindah halaman
})

function clearKeyword() {
  router.replace({ name: 'cari-laporan', query: { ...route.query, q: undefined } })
}

// ---- Kolom cari cadangan: hanya tampil di layar yang kolom cari navbar-nya disembunyikan (< xl) ----
const draft = ref('')
watch(keyword, (value) => (draft.value = value), { immediate: true })
function submitSearch() {
  const q = draft.value.trim()
  router.push({ name: 'cari-laporan', query: { ...route.query, q: q || undefined } })
}

onMounted(async () => {
  reload()
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
  <section class="relative overflow-hidden">
    <!-- Dekorasi latar mengikuti referensi; hapus kalau tidak cocok dengan swirl.svg milikmu -->
    <img
      src="@/assets/images/swirl.svg"
      alt=""
      aria-hidden="true"
      class="pointer-events-none absolute -right-24 top-0 hidden w-[32rem] opacity-60 lg:block"
    />
    <div class="pointer-events-none absolute -bottom-4 -left-2 hidden lg:block" aria-hidden="true">
      <span class="absolute bottom-6 left-2 h-24 w-5 rotate-[30deg] rounded-full bg-lime"></span>
      <span class="absolute bottom-0 left-12 h-16 w-5 rotate-[50deg] rounded-full bg-lime"></span>
    </div>

    <div class="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-12">
      <header>
        <div class="relative inline-block">
          <svg
            class="absolute -left-9 -top-3 hidden size-10 text-maroon lg:block"
            viewBox="0 0 48 48"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M5 38 L20 33" />
            <path d="M9 24 L22 17" />
            <path d="M24 6 L30 20" />
          </svg>
          <h1 class="text-4xl font-extrabold tracking-tight text-maroon lg:text-5xl">
            {{ keyword ? 'Hasil Pencarian' : 'Cari Laporan' }}
          </h1>
        </div>

        <p v-if="keyword" class="mt-2 text-base text-maroon/80">
          Menampilkan laporan yang sesuai dengan kata kunci
          <span class="ml-1 inline-flex items-center gap-1.5 rounded-full bg-lime px-3 py-0.5 font-bold text-maroon">
            “{{ keyword }}”
            <button
              type="button"
              class="grid size-5 cursor-pointer place-items-center rounded-full hover:bg-maroon/10"
              aria-label="Hapus kata kunci"
              @click="clearKeyword"
            >
              <X class="size-3.5" aria-hidden="true" />
            </button>
          </span>
        </p>
        <p v-else class="mt-2 text-base text-maroon/80">Telusuri laporan warga yang sudah terverifikasi.</p>
        <p v-if="keyword && !searchTerm" class="mt-1 text-sm text-maroon/70">
          Kata kunci minimal 2 karakter, jadi semua laporan ditampilkan.
        </p>
      </header>

      <form class="relative mt-5 xl:hidden" role="search" @submit.prevent="submitSearch">
        <label for="page-search" class="sr-only">Cari laporan</label>
        <Search
          class="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-maroon"
          aria-hidden="true"
        />
        <input
          id="page-search"
          v-model="draft"
          type="search"
          placeholder="Cari laporan..."
          class="h-11 w-full rounded-full border border-sand-dark bg-white/70 pl-10 pr-4 text-sm text-maroon placeholder:text-maroon/50 focus:border-maroon focus:outline-none"
        />
      </form>

      <div class="mt-6">
        <LaporanFilter :categories="categories" @change="onFilter">
          <template #summary>
            <p v-if="!loading && items.length" class="text-sm text-maroon/80">
              Menampilkan <strong class="font-extrabold text-maroon">{{ items.length }}{{ hasMore ? '+' : '' }}</strong>
              laporan
            </p>
          </template>
        </LaporanFilter>
      </div>

      <div class="mt-6">
        <BaseLoading v-if="loading" />

        <template v-else-if="error && !items.length">
          <p class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{{ error }}</p>
          <BaseButton variant="secondary" @click="reload()">Coba lagi</BaseButton>
        </template>

        <BaseEmptyState
          v-else-if="!items.length"
          title="Laporan tidak ditemukan"
          :description="hasActiveFilter ? 'Coba ubah kata kunci atau filter.' : 'Belum ada laporan yang tampil.'"
        />

        <template v-else>
          <ul class="grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <li v-for="report in items" :key="report.id"><LaporanSearchCard :report="report" /></li>
          </ul>
          <p v-if="error" class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {{ error }}
          </p>
          <BasePagination :has-more="hasMore" :loading="loadingMore" @load-more="loadMore" />
        </template>
      </div>
    </div>
  </section>
</template>