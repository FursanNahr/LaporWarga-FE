<script setup>
import { computed, reactive } from 'vue'
import { ArrowRight, Building2, CalendarClock, Clock, ImageOff, Search, User } from 'lucide-vue-next'
import { adminApi } from '@/api/admin.api'
import { useFilteredList } from '@/composables/useFilteredList'
import { REPORT_STATUS } from '@/constants/status'
import { formatAge, formatDateTime } from '@/utils/formatDate'
import { mediaUrl } from '@/utils/media'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseEmptyState from '@/components/common/BaseEmptyState.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import BasePagination from '@/components/common/BasePagination.vue'

// Dua antrean: belum diperiksa, dan sudah valid tapi belum diteruskan ke instansi.
const TABS = [
  { status: REPORT_STATUS.MENUNGGU_VERIFIKASI, label: 'Menunggu verifikasi' },
  { status: REPORT_STATUS.TERVERIFIKASI, label: 'Belum diteruskan' },
]

// Antrean: yang paling lama menunggu ada di atas.
const fetchQueue = (params) => adminApi.listLaporan({ ...params, order: 'asc' })

const { filters, items, loading, loadingMore, error, hasMore, loadMore, keywordTooShort } = useFilteredList(
  fetchQueue,
  { initial: { status: TABS[0].status, q: '' }, limit: 15 },
)

// Ringkasan dari item yang sudah dimuat (tanda "+" jika masih ada halaman berikutnya).
const totalLabel = computed(() => `${items.value.length}${hasMore.value ? '+' : ''}`)
const overdueCount = computed(() => items.value.filter((item) => item.sla?.isOverdue).length)
const isOverdue = (item) => Boolean(item.sla?.isOverdue)

// Thumbnail: foto pertama laporan; jika gagal dimuat, tampilkan placeholder.
const brokenThumbs = reactive(new Set())
const thumbOf = (item) => (brokenThumbs.has(item.id) ? '' : mediaUrl(item.photos?.[0]?.url))
</script>

<template>
  <section class="mx-auto w-full max-w-[1400px] px-5 py-8 lg:px-8">
    <!-- Header -->
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-4xl font-extrabold tracking-tight text-maroon sm:text-5xl">
          <span class="relative inline-block">
            Verifikasi
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
          Laporan
        </h1>
        <p class="mt-3 max-w-2xl text-lg text-maroon/80">
          Periksa laporan masuk, lalu verifikasi, tolak dengan alasan, atau teruskan ke instansi.
        </p>
      </div>

      <div v-if="!loading && !error" class="flex flex-wrap gap-3" aria-live="polite">
        <div class="rounded-2xl border border-sand-dark bg-sand px-5 py-3">
          <p class="text-2xl font-extrabold leading-none text-maroon">{{ totalLabel }}</p>
          <p class="mt-1 text-xs font-semibold text-maroon/70">Dalam antrean</p>
        </div>
        <div
          class="rounded-2xl border px-5 py-3"
          :class="overdueCount ? 'border-red-300 bg-red-50 text-red-800' : 'border-sand-dark bg-sand text-maroon'"
        >
          <p class="text-2xl font-extrabold leading-none">{{ overdueCount }}</p>
          <p class="mt-1 text-xs font-semibold opacity-70">Melewati SLA</p>
        </div>
      </div>
    </header>

    <!-- Tab & pencarian -->
    <div class="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div role="group" aria-label="Antrean" class="flex flex-wrap gap-2">
        <button
          v-for="tab in TABS"
          :key="tab.status"
          type="button"
          class="h-11 cursor-pointer rounded-full px-5 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
          :class="filters.status === tab.status ? 'bg-maroon text-white' : 'bg-sand text-maroon hover:bg-sand-dark/60'"
          :aria-pressed="filters.status === tab.status"
          @click="filters.status = tab.status"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="w-full lg:max-w-md">
        <label for="q" class="sr-only">Cari laporan</label>
        <div class="relative">
          <Search class="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-maroon" aria-hidden="true" />
          <input
            id="q"
            v-model="filters.q"
            type="search"
            placeholder="Kode, kata kunci, alamat, atau nama pelapor"
            class="h-11 w-full rounded-full border border-sand-dark bg-white/70 pl-11 pr-4 text-sm text-maroon placeholder:text-maroon/50 focus:border-maroon focus:outline-none"
          />
        </div>
        <p v-if="keywordTooShort" class="mt-1.5 pl-4 text-xs text-maroon/70">Kata kunci minimal 2 karakter.</p>
      </div>
    </div>

    <!-- Status -->
    <p
      v-if="error"
      class="mt-6 rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-sm font-semibold text-red-800"
      role="alert"
    >
      {{ error }}
    </p>
    <BaseLoading v-if="loading" class="mt-10" text="Memuat antrean..." />
    <BaseEmptyState
      v-else-if="!items.length && !error"
      class="mt-10"
      title="Antrean kosong"
      description="Tidak ada laporan yang perlu ditinjau di tab ini."
    />

    <!-- Kartu antrean -->
    <ul v-else class="mt-6 grid gap-4 lg:grid-cols-2">
      <li v-for="item in items" :key="item.id">
        <article
          class="flex h-full flex-col gap-4 rounded-2xl border p-5 transition-transform hover:-translate-y-0.5"
          :class="isOverdue(item) ? 'border-red-300 bg-red-50' : 'border-sand-dark bg-sand'"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <RouterLink
              :to="{ name: 'admin-detail-laporan', params: { id: item.id } }"
              class="rounded-lg bg-white px-3 py-1.5 text-sm font-extrabold tracking-wide text-maroon hover:bg-lime"
            >
              {{ item.trackingCode }}
            </RouterLink>
            <span class="inline-flex items-center gap-1.5 text-sm font-semibold text-maroon/80">
              <Clock class="size-4" aria-hidden="true" />
              Menunggu {{ formatAge(item.createdAt) }}
            </span>
          </div>

          <div class="flex min-w-0 flex-1 gap-4">
            <div class="relative size-24 shrink-0 overflow-hidden rounded-xl border border-sand-dark bg-white sm:size-28">
              <img
                v-if="thumbOf(item)"
                :src="thumbOf(item)"
                :alt="`Foto laporan ${item.trackingCode}`"
                loading="lazy"
                class="size-full object-cover"
                @error="brokenThumbs.add(item.id)"
              />
              <div v-else class="grid size-full place-items-center text-maroon/40" aria-hidden="true">
                <ImageOff class="size-6" />
              </div>
              <span
                v-if="item.photoCount > 1"
                class="absolute bottom-1 right-1 rounded-full bg-maroon/85 px-2 py-0.5 text-[11px] font-bold text-white"
              >+{{ item.photoCount - 1 }}</span>
            </div>

            <div class="min-w-0 flex-1">
              <p v-if="item.subcategory" class="font-extrabold text-maroon">{{ item.subcategory.name }}</p>
              <p class="mt-1 line-clamp-3 text-sm leading-relaxed text-maroon/80">{{ item.description }}</p>
            </div>
          </div>

          <dl class="grid gap-2 text-sm text-maroon sm:grid-cols-2">
            <div class="flex items-start gap-2">
              <User class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div class="min-w-0">
                <dt class="sr-only">Pelapor</dt>
                <dd class="font-semibold">
                  {{ item.reporter.name }}
                  <BaseBadge v-if="item.isAnonymous" variant="warning" class="ml-1">Anonim</BaseBadge>
                </dd>
                <dd class="truncate text-xs text-maroon/70">{{ item.reporter.email }}</dd>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <Building2 class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div class="min-w-0">
                <dt class="sr-only">Instansi</dt>
                <dd class="font-semibold">{{ item.agency?.name ?? 'Belum ditentukan' }}</dd>
              </div>
            </div>
          </dl>

          <div class="flex flex-wrap items-center justify-between gap-3 border-t border-maroon/10 pt-4">
            <div class="flex items-center gap-2 text-sm">
              <CalendarClock class="size-4 shrink-0" :class="isOverdue(item) ? 'text-red-700' : 'text-maroon/70'" aria-hidden="true" />
              <template v-if="item.sla?.dueAt">
                <span
                  v-if="isOverdue(item)"
                  class="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white"
                >Terlewat</span>
                <span :class="isOverdue(item) ? 'font-semibold text-red-800' : 'text-maroon/80'">
                  Batas {{ formatDateTime(item.sla.dueAt) }}
                </span>
              </template>
              <span v-else class="text-maroon/60">Belum ada batas SLA</span>
            </div>

            <RouterLink
              :to="{ name: 'admin-detail-laporan', params: { id: item.id } }"
              class="inline-flex h-10 items-center gap-2 rounded-full bg-lime px-5 text-sm font-bold text-maroon-dark transition-colors hover:bg-lime-dark"
            >
              Tinjau <ArrowRight class="size-4" aria-hidden="true" />
            </RouterLink>
          </div>
        </article>
      </li>
    </ul>

    <BasePagination :has-more="hasMore" :loading="loadingMore" @load-more="loadMore" />
  </section>
</template>