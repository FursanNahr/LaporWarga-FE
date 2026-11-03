<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Clock,
  FileText,
  Plus,
  Trophy,
} from 'lucide-vue-next'
import { laporanApi } from '@/api/laporan.api'
import { usePagination } from '@/composables/usePagination'
import { REPORT_STATUS } from '@/constants/status'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseEmptyState from '@/components/common/BaseEmptyState.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import LaporanSayaCard from '@/components/laporan/LaporanSayaCard.vue'

const PAGE_SIZE = 5 // laporan per halaman (pagination di FE)
const FETCH_LIMIT = 50 // batas maksimum per request di BE
const MAX_REQUESTS = 20 // pengaman supaya loop pengambilan data tidak tak terbatas

// Semua laporan milik user diambil sekali, lalu difilter dan dihitung di FE.
// Alasannya: /reports/me hanya menerima satu nilai `status`, sedangkan tab "Diproses"
// mencakup beberapa status, dan angka di tiap tab butuh seluruh data.
const { items, error, hasMore, load, loadMore } = usePagination(laporanApi.mine, {
  limit: FETCH_LIMIT,
})
const syncing = ref(true)

async function loadAll() {
  syncing.value = true
  try {
    await load({})
    for (let i = 1; i < MAX_REQUESTS && hasMore.value && !error.value; i++) {
      await loadMore()
    }
  } finally {
    syncing.value = false
  }
}

onMounted(loadAll)

const PROCESS_STATUSES = [
  REPORT_STATUS.MENUNGGU_VERIFIKASI,
  REPORT_STATUS.TERVERIFIKASI,
  REPORT_STATUS.DITERUSKAN,
  REPORT_STATUS.DALAM_PENANGANAN,
]

const TABS = [
  { key: 'semua', label: 'Semua Laporan', icon: FileText, match: () => true },
  { key: 'diproses', label: 'Diproses', icon: Clock, match: (s) => PROCESS_STATUSES.includes(s) },
  { key: 'selesai', label: 'Selesai', icon: CircleCheck, match: (s) => s === REPORT_STATUS.SELESAI },
  { key: 'ditolak', label: 'Ditolak', icon: CircleX, match: (s) => s === REPORT_STATUS.DITOLAK },
]

const tab = ref('semua')
const page = ref(1)
const listRef = ref(null)

const counts = computed(() =>
  Object.fromEntries(
    TABS.map((t) => [t.key, items.value.filter((report) => t.match(report.status)).length]),
  ),
)

const filtered = computed(() => {
  const active = TABS.find((t) => t.key === tab.value)
  return items.value.filter((report) => active.match(report.status))
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))
const paged = computed(() => filtered.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))

const rangeStart = computed(() => (filtered.value.length ? (page.value - 1) * PAGE_SIZE + 1 : 0))
const rangeEnd = computed(() => Math.min(page.value * PAGE_SIZE, filtered.value.length))

// Maksimal 5 nomor halaman ditampilkan, bergeser mengikuti halaman aktif.
const pageNumbers = computed(() => {
  const start = Math.max(1, Math.min(page.value - 2, totalPages.value - 4))
  const end = Math.min(totalPages.value, start + 4)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

watch(tab, () => (page.value = 1))

function goTo(n) {
  if (n < 1 || n > totalPages.value) return
  page.value = n
  listRef.value?.scrollIntoView({ block: 'start' })
}
</script>

<template>
  <section class="mx-auto w-full max-w-[1400px] px-5 py-8 lg:px-8">
    <header class="flex flex-wrap items-start justify-between gap-5">
      <div>
        <h1 class="text-4xl font-extrabold tracking-tight text-maroon sm:text-5xl">
          <span class="relative inline-block">
            Laporan
            <svg
              class="absolute -bottom-1.5 left-0 h-2.5 w-full"
              viewBox="0 0 200 12"
              preserveAspectRatio="none"
              fill="none"
              aria-hidden="true"
            >
              <path d="M2 8C45 2 120 2 198 7" stroke="#c1f52f" stroke-width="4" stroke-linecap="round" />
            </svg>
          </span>
          Saya
        </h1>
        <p class="mt-3 text-lg text-maroon/80">Pantau perkembangan laporan yang pernah kamu buat.</p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <div
          v-if="!syncing && items.length"
          class="flex items-center gap-4 rounded-2xl border border-sand-dark bg-sand px-5 py-3"
        >
          <Trophy class="size-9 text-maroon" aria-hidden="true" />
          <div>
            <p class="text-sm font-semibold text-maroon">Total Laporan Kamu</p>
            <p class="text-3xl font-extrabold leading-none text-maroon">{{ items.length }}</p>
          </div>
        </div>

        <RouterLink
          :to="{ name: 'warga-buat-laporan' }"
          class="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-3 text-sm font-bold text-maroon-dark transition-colors hover:bg-lime-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
        >
          <Plus class="size-4" aria-hidden="true" />
          Buat laporan
        </RouterLink>
      </div>
    </header>

    <div v-if="syncing" class="mt-10"><BaseLoading /></div>

    <div v-else-if="error && !items.length" class="mt-10">
      <p class="form-alert" role="alert">{{ error }}</p>
      <BaseButton variant="secondary" @click="loadAll">Coba lagi</BaseButton>
    </div>

    <div v-else-if="!items.length" class="mt-10">
      <BaseEmptyState title="Belum ada laporan" description="Laporan yang kamu buat akan muncul di sini.">
        <RouterLink
          class="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-3 text-sm font-bold text-maroon-dark transition-colors hover:bg-lime-dark"
          :to="{ name: 'warga-buat-laporan' }"
        >
          Buat laporan pertama
        </RouterLink>
      </BaseEmptyState>
    </div>

    <template v-else>
      <div role="group" aria-label="Filter status laporan" class="mt-8 max-w-full overflow-x-auto">
        <div class="inline-flex min-w-max rounded-full border border-sand-dark bg-white/60 p-1">
          <button
            v-for="t in TABS"
            :key="t.key"
            type="button"
            :aria-pressed="tab === t.key"
            class="relative inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
            :class="tab === t.key ? 'bg-maroon text-white' : 'text-maroon hover:bg-sand'"
            @click="tab = t.key"
          >
            <component :is="t.icon" class="size-4" aria-hidden="true" />
            {{ t.label }} ({{ counts[t.key] }})
            <span
              v-if="tab === t.key"
              class="absolute inset-x-5 bottom-0 h-0.5 rounded-full bg-lime"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      <template v-if="filtered.length">
        <ul ref="listRef" class="mt-6 flex scroll-mt-28 flex-col gap-4">
          <li v-for="report in paged" :key="report.id"><LaporanSayaCard :report="report" /></li>
        </ul>

        <p v-if="error" class="form-alert mt-4" role="alert">{{ error }}</p>
        <BaseButton v-if="error && hasMore" class="mt-2" variant="secondary" @click="loadAll">
          Muat ulang
        </BaseButton>

        <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm text-maroon/80">
            Menampilkan {{ rangeStart }}–{{ rangeEnd }} dari {{ filtered.length }} laporan
          </p>

          <nav aria-label="Halaman laporan" class="flex items-center gap-2">
            <button
              type="button"
              :disabled="page === 1"
              aria-label="Halaman sebelumnya"
              class="grid size-10 place-items-center rounded-xl border border-sand-dark bg-white/70 text-maroon transition-colors hover:bg-sand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/70"
              @click="goTo(page - 1)"
            >
              <ChevronLeft class="size-4" aria-hidden="true" />
            </button>

            <button
              v-for="n in pageNumbers"
              :key="n"
              type="button"
              :aria-current="n === page ? 'page' : undefined"
              :aria-label="`Halaman ${n}`"
              class="grid size-10 place-items-center rounded-xl border text-sm font-bold transition-colors"
              :class="
                n === page
                  ? 'border-maroon bg-maroon text-white'
                  : 'border-sand-dark bg-white/70 text-maroon hover:bg-sand'
              "
              @click="goTo(n)"
            >
              {{ n }}
            </button>

            <button
              type="button"
              :disabled="page === totalPages"
              aria-label="Halaman berikutnya"
              class="grid size-10 place-items-center rounded-xl border border-sand-dark bg-white/70 text-maroon transition-colors hover:bg-sand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/70"
              @click="goTo(page + 1)"
            >
              <ChevronRight class="size-4" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </template>

      <div v-else class="mt-6">
        <BaseEmptyState title="Tidak ada laporan" description="Tidak ada laporan dengan status ini." />
      </div>
    </template>
  </section>
</template>