<script setup>
import { computed } from 'vue'
import { ArrowRight, Building2, Clock, MapPin } from 'lucide-vue-next'
import { assetUrl } from '@/api'
import { REPORT_STATUS } from '@/constants/status'
import { formatDate } from '@/utils/formatDate'
import ProgressSteps from '@/components/laporan/ProgressSteps.vue'
import StatusBadge from '@/components/laporan/StatusBadge.vue'

/**
 * LaporanSayaCard: kartu horizontal satu laporan khusus halaman Laporan Saya.
 * `report` = satu item dari GET /reports/me.
 * LaporanCard.vue tetap dipakai di Cari Laporan.
 */
const props = defineProps({
  report: { type: Object, required: true },
})

const photo = computed(() => assetUrl(props.report.photos?.[0]?.url))
const photoCount = computed(() => props.report.photos?.length ?? 0)

const title = computed(() => props.report.subcategory?.name ?? props.report.trackingCode)
const category = computed(() => props.report.subcategory?.category?.name ?? '')

const location = computed(() =>
  [props.report.address, props.report.district?.name].filter(Boolean).join(', '),
)

const isRejected = computed(() => props.report.status === REPORT_STATUS.DITOLAK)
</script>

<template>
  <article
    class="flex flex-col gap-4 rounded-2xl border border-sand-dark bg-white/70 p-3 sm:flex-row sm:items-center sm:p-4"
  >
    <div class="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-sand sm:aspect-auto sm:h-32 sm:w-52">
      <img
        v-if="photo"
        :src="photo"
        :alt="`Foto laporan ${report.trackingCode}`"
        loading="lazy"
        class="size-full object-cover"
      />
      <div v-else class="grid size-full place-items-center text-sm text-maroon/60">Tanpa foto</div>
      <span
        v-if="photoCount > 1"
        class="absolute bottom-2 right-2 rounded-full bg-maroon-dark/80 px-2 py-0.5 text-xs font-semibold text-white"
      >
        {{ photoCount }} foto
      </span>
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-4 xl:flex-row xl:items-center">
      <div class="min-w-0 flex-1">
        <p class="text-xs font-semibold text-maroon/70">
          {{ report.trackingCode }}<template v-if="category"> • {{ category }}</template>
        </p>
        <h2 class="mt-0.5 text-lg font-bold leading-snug text-maroon">{{ title }}</h2>
        <p v-if="report.description" class="mt-0.5 line-clamp-1 text-sm text-maroon/70">
          {{ report.description }}
        </p>

        <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-maroon/80">
          <li v-if="location" class="flex min-w-0 max-w-full items-center gap-1.5">
            <MapPin class="size-4 shrink-0" aria-hidden="true" />
            <span class="truncate" :title="location">{{ location }}</span>
          </li>
          <li v-if="report.agency" class="flex min-w-0 max-w-full items-center gap-1.5">
            <Building2 class="size-4 shrink-0" aria-hidden="true" />
            <span class="truncate" :title="report.agency.name">{{ report.agency.name }}</span>
          </li>
        </ul>

        <p class="mt-1 flex items-center gap-1.5 text-sm text-maroon/70">
          <Clock class="size-4 shrink-0" aria-hidden="true" />
          Dilaporkan pada {{ formatDate(report.createdAt) }}
        </p>

        <div class="mt-2"><StatusBadge :status="report.status" /></div>
      </div>

      <div class="w-full max-w-md xl:w-80 xl:shrink-0">
        <div v-if="isRejected" class="rounded-xl bg-rose-50 px-4 py-3 text-sm text-maroon">
          <p class="font-bold">Alasan Penolakan:</p>
          <p class="mt-1">{{ report.rejectionReason || 'Tidak ada alasan yang dicatat.' }}</p>
        </div>
        <ProgressSteps v-else :status="report.status" />
      </div>

      <div class="xl:border-l xl:border-sand-dark xl:pl-5">
        <RouterLink
          :to="{ name: 'detail-laporan', params: { id: report.id } }"
          class="inline-flex items-center gap-2 rounded-full border border-maroon px-5 py-2.5 text-sm font-semibold text-maroon transition-colors hover:bg-maroon hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
        >
          Lihat Detail
          <ArrowRight class="size-4" aria-hidden="true" />
        </RouterLink>
      </div>
    </div>
  </article>
</template>