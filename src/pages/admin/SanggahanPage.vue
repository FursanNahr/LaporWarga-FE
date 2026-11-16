<script setup>
import { onMounted, ref } from 'vue'
import { Building2, MapPin, RotateCcw, TriangleAlert, User } from 'lucide-vue-next'
import { assetUrl } from '@/api'
import { confirmationApi } from '@/api/confirmation.api'
import { useToast } from '@/composables/useToast'
import { formatDateTime } from '@/utils/formatDate'
import BaseLoading from '@/components/common/BaseLoading.vue'
import DisputeDecisionForm from '@/components/admin/DisputeDecisionForm.vue'

/**
 * SanggahanPage: antrean laporan yang disanggah pelapor dan menunggu keputusan admin.
 * Data dari GET /admin/disputes (cursor pagination). Keputusan lewat DisputeDecisionForm.
 */
const toast = useToast()

const PAGE_SIZE = 10

const items = ref([])
const meta = ref({ hasMore: false, nextCursor: null })
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const openId = ref(null) // id laporan yang form keputusannya sedang terbuka

async function fetchPage({ reset = false } = {}) {
  if (reset) loading.value = true
  else loadingMore.value = true
  error.value = ''

  try {
    const cursor = reset ? undefined : meta.value.nextCursor
    const { data: body } = await confirmationApi.listDisputes({ cursor, limit: PAGE_SIZE })
    items.value = reset ? body.data : [...items.value, ...body.data]
    meta.value = body.meta ?? { hasMore: false, nextCursor: null }
  } catch (e) {
    error.value = e.normalized?.message ?? 'Gagal memuat daftar sanggahan.'
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

onMounted(() => fetchPage({ reset: true }))

function toggle(item) {
  openId.value = openId.value === item.id ? null : item.id
}

function handleResolved(item, decision) {
  items.value = items.value.filter((row) => row.id !== item.id)
  openId.value = null
  toast.success(
    decision === 'REOPEN'
      ? `Laporan ${item.trackingCode} dibuka kembali.`
      : `Laporan ${item.trackingCode} ditutup.`,
  )
}

const card = 'rounded-3xl border border-sand-dark/70 bg-white/60 p-5 shadow-sm sm:p-6'
</script>

<template>
  <section class="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
    <header class="mb-6">
      <h1 class="flex items-center gap-3 text-3xl font-extrabold tracking-tight">
        <TriangleAlert class="size-8" aria-hidden="true" /> Sanggahan Laporan
      </h1>
      <p class="mt-1 text-maroon/70">
        Pelapor menyatakan hasil penanganan belum beres. Periksa bukti, lalu putuskan laporan dibuka kembali atau ditutup.
      </p>
    </header>

    <BaseLoading v-if="loading" text="Memuat sanggahan..." />

    <p
      v-else-if="error && !items.length"
      class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
      role="alert"
    >
      {{ error }}
    </p>

    <p v-else-if="!items.length" class="rounded-2xl bg-sand px-4 py-6 text-center text-sm">
      Tidak ada sanggahan yang menunggu keputusan.
    </p>

    <ul v-else class="grid gap-5">
      <li v-for="item in items" :key="item.id" :class="card">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full bg-lime/35 px-3.5 py-1.5 text-sm font-extrabold">{{ item.trackingCode }}</span>
              <span v-if="item.reopenCount" class="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                <RotateCcw class="size-3.5" aria-hidden="true" /> Dibuka kembali {{ item.reopenCount }} kali
              </span>
              <span v-if="item.escalatedAt" class="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">Eskalasi</span>
              <span v-if="item.isOverdue" class="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">Melewati SLA</span>
            </div>
            <p v-if="item.subcategory" class="mt-2 text-sm font-bold">{{ item.subcategory.name }}</p>
          </div>
          <RouterLink
            :to="{ name: 'admin-detail-laporan', params: { id: item.id } }"
            class="inline-flex h-10 items-center rounded-full border border-sand-dark bg-white/80 px-4 text-sm font-bold hover:bg-sand"
          >
            Lihat detail
          </RouterLink>
        </div>

        <ul class="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <li v-if="item.address" class="flex items-center gap-2"><MapPin class="size-4 shrink-0" aria-hidden="true" />{{ item.address }}</li>
          <li v-if="item.agency" class="flex items-center gap-2"><Building2 class="size-4 shrink-0" aria-hidden="true" />{{ item.agency.name }}</li>
          <li v-if="item.reporter" class="flex items-center gap-2"><User class="size-4 shrink-0" aria-hidden="true" />{{ item.reporter.name }}</li>
        </ul>

        <p class="mt-3 line-clamp-3 whitespace-pre-line break-words text-sm leading-relaxed text-maroon/80">{{ item.description }}</p>

        <!-- Sanggahan terbaru dari pelapor -->
        <div v-if="item.dispute" class="mt-4 rounded-2xl border border-red-200 bg-red-50/60 p-4">
          <p class="flex flex-wrap items-center justify-between gap-2 text-sm font-extrabold text-red-800">
            <span>Alasan sanggahan pelapor</span>
            <time class="text-xs font-normal text-maroon/70" :datetime="item.dispute.createdAt">{{ formatDateTime(item.dispute.createdAt) }}</time>
          </p>
          <p class="mt-1 whitespace-pre-line break-words text-sm leading-relaxed">{{ item.dispute.note }}</p>
          <ul v-if="item.dispute.photos?.length" class="mt-3 flex flex-wrap gap-3">
            <li v-for="(url, index) in item.dispute.photos" :key="url">
              <a
                :href="assetUrl(url)"
                target="_blank"
                rel="noopener"
                class="block overflow-hidden rounded-xl border border-sand-dark hover:border-maroon"
              >
                <img :src="assetUrl(url)" :alt="`Foto bukti sanggahan ${index + 1}`" loading="lazy" class="block h-[84px] w-28 object-cover" />
              </a>
            </li>
          </ul>
        </div>

        <div class="mt-4">
          <button
            type="button"
            class="inline-flex h-11 cursor-pointer items-center rounded-full bg-maroon px-5 text-sm font-bold text-white hover:bg-maroon-dark"
            :aria-expanded="openId === item.id"
            @click="toggle(item)"
          >
            {{ openId === item.id ? 'Tutup form' : 'Putuskan sanggahan' }}
          </button>
        </div>

        <div v-if="openId === item.id" class="mt-4 border-t border-sand-dark pt-4">
          <DisputeDecisionForm
            :report-id="item.id"
            :tracking-code="item.trackingCode"
            @resolved="handleResolved(item, $event)"
          />
        </div>
      </li>
    </ul>

    <p v-if="error && items.length" class="mt-4 text-sm font-semibold text-red-700" role="alert">{{ error }}</p>

    <div v-if="meta.hasMore" class="mt-6 text-center">
      <button
        type="button"
        class="h-11 cursor-pointer rounded-full border border-sand-dark bg-white/80 px-6 text-sm font-bold hover:bg-sand disabled:cursor-wait disabled:opacity-60"
        :disabled="loadingMore"
        @click="fetchPage()"
      >
        {{ loadingMore ? 'Memuat…' : 'Muat lebih banyak' }}
      </button>
    </div>
  </section>
</template>
