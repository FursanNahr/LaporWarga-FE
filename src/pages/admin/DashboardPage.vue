<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { AlarmClock, ArrowRight, Building2, CalendarDays, Check, ClipboardList, Clock, FileText, Flag, MapPin, RefreshCw } from 'lucide-vue-next'
import { adminApi } from '@/api/admin.api'
import { REPORT_STATUS } from '@/constants/status'
import { formatDate } from '@/utils/formatDate'
import { statusLabel, statusVariant } from '@/utils/formatStatus'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import ProgressRing from '@/components/beranda/ProgressRing.vue'
import StatusBadge from '@/components/laporan/StatusBadge.vue'

const data = ref(null)
const loading = ref(true)
const error = ref('')
const animated = ref(false) // bar tumbuh dari 0 saat data pertama kali tampil

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data: body } = await adminApi.dashboard()
    data.value = body.data
    await nextTick()
    requestAnimationFrame(() => (animated.value = true))
  } catch (e) {
    error.value = e.normalized?.message ?? 'Gagal memuat dashboard.'
  } finally {
    loading.value = false
  }
}
onMounted(load)

// ---- Kartu utama (butuh tindakan) & kartu ringkas ----
const primaryCards = computed(() => {
  const t = data.value.totals
  return [
    {
      key: 'pending',
      label: 'Menunggu verifikasi',
      value: t.pendingVerification,
      icon: ClipboardList,
      to: { name: 'admin-verifikasi-laporan' },
      tone: 'bg-lime text-maroon-dark hover:bg-lime-dark',
      iconTone: 'bg-maroon text-lime',
    },
    {
      key: 'overdue',
      label: 'Melewati SLA',
      value: t.overdue,
      icon: AlarmClock,
      to: { name: 'admin-kelola-laporan', query: { isOverdue: 'true' } },
      tone: t.overdue > 0 ? 'bg-red-600 text-white hover:bg-red-700' : 'border border-sand-dark bg-sand text-maroon hover:bg-sand-dark/40',
      iconTone: t.overdue > 0 ? 'bg-white text-red-600' : 'bg-lime text-maroon-dark',
    },
    {
      key: 'total',
      label: 'Total laporan',
      value: t.reports,
      icon: FileText,
      to: { name: 'admin-kelola-laporan' },
      tone: 'bg-maroon text-white hover:bg-maroon-dark',
      iconTone: 'bg-lime text-maroon-dark',
    },
  ]
})

const miniStats = computed(() => {
  const t = data.value.totals
  return [
    { label: 'Laporan bulan ini', value: t.thisMonth, icon: CalendarDays },
    { label: 'Selesai', value: t.resolved, icon: Check },
    { label: 'Pernah disanggah', value: t.disputed, icon: Flag },
    { label: 'Rata-rata penanganan', value: t.avgResolutionDays === null ? '-' : `${t.avgResolutionDays} hari`, icon: Clock },
  ]
})

// ---- Per status ----
const STATUS_BAR = {
  neutral: 'bg-maroon/40',
  primary: 'bg-maroon',
  info: 'bg-sky-600',
  success: 'bg-lime-dark',
  warning: 'bg-amber-500',
  danger: 'bg-red-600',
}
const statusRows = computed(() =>
  Object.values(REPORT_STATUS).map((status) => ({
    status,
    count: data.value.byStatus[status] ?? 0,
    bar: STATUS_BAR[statusVariant(status)] ?? STATUS_BAR.primary,
  })),
)
const statusMax = computed(() => Math.max(1, ...statusRows.value.map((row) => row.count)))
const statusWidth = (count) => (animated.value ? `${(count / statusMax.value) * 100}%` : '0%')

// ---- Tren harian ----
const trendMax = computed(() => Math.max(1, ...data.value.trend.map((day) => day.count)))
const trendTotal = computed(() => data.value.trend.reduce((sum, day) => sum + day.count, 0))
const barHeight = (count) => (animated.value ? `${Math.max(count > 0 ? 6 : 2, Math.round((count / trendMax.value) * 100))}%` : '2%')

// ---- Per instansi ----
const agencyRows = computed(() =>
  data.value.byAgency.map((agency) => ({
    ...agency,
    percentValue: agency.total ? Math.round((agency.resolved / agency.total) * 100) : 0,
    percent: agency.total ? `${Math.round((agency.resolved / agency.total) * 100)}%` : '-',
  })),
)

// ---- Per kecamatan ----
const districtMax = computed(() => Math.max(1, ...data.value.byDistrict.map((district) => district.total)))
const districtWidth = (total) => (animated.value ? `${(total / districtMax.value) * 100}%` : '0%')

const alertClass = 'rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-sm font-semibold text-red-800'
const panelClass = 'rounded-2xl border border-sand-dark bg-sand p-5 sm:p-6'
</script>

<template>
  <section class="mx-auto w-full max-w-[1400px] px-5 py-8 lg:px-8">
    <!-- Header -->
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-4xl font-extrabold tracking-tight text-maroon sm:text-5xl">
          <span class="relative inline-block">
            Dashboard
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
        </h1>
        <p class="mt-3 max-w-2xl text-lg text-maroon/80">
          Ringkasan laporan. Laporan duplikat yang sudah digabung tidak dihitung.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border-2 border-maroon px-5 text-sm font-bold text-maroon transition-colors hover:bg-maroon hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="loading"
        @click="load"
      >
        <RefreshCw class="size-4" :class="{ 'animate-spin': loading }" aria-hidden="true" />
        Muat ulang
      </button>
    </header>

    <BaseLoading v-if="loading && !data" class="mt-10" text="Memuat dashboard..." />
    <p v-else-if="error && !data" :class="[alertClass, 'mt-8']" role="alert">{{ error }}</p>

    <div v-else-if="data" class="mt-8 space-y-10">
      <p v-if="error" :class="alertClass" role="alert">{{ error }}</p>

      <!-- Kartu utama -->
      <div class="grid gap-4 md:grid-cols-3">
        <RouterLink
          v-for="card in primaryCards"
          :key="card.key"
          :to="card.to"
          class="group flex flex-col justify-between gap-6 rounded-3xl p-6 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
          :class="card.tone"
        >
          <div class="flex items-center justify-between">
            <span class="flex size-11 items-center justify-center rounded-full" :class="card.iconTone" aria-hidden="true">
              <component :is="card.icon" class="size-5" />
            </span>
            <ArrowRight class="size-5 opacity-60 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </div>
          <div>
            <p class="text-5xl font-extrabold leading-none tracking-tight">{{ card.value }}</p>
            <p class="mt-2 text-sm font-bold opacity-80">{{ card.label }}</p>
          </div>
        </RouterLink>
      </div>

      <!-- Kartu ringkas -->
      <dl class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div v-for="stat in miniStats" :key="stat.label" class="flex items-center gap-3 rounded-2xl border border-sand-dark bg-sand px-4 py-4">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-full bg-lime text-maroon-dark" aria-hidden="true">
            <component :is="stat.icon" class="size-5" />
          </span>
          <div class="min-w-0">
            <dd class="truncate text-xl font-extrabold leading-tight text-maroon">{{ stat.value }}</dd>
            <dt class="text-xs font-semibold text-maroon/70">{{ stat.label }}</dt>
          </div>
        </div>
      </dl>

      <!-- Laporan melewati SLA -->
      <section aria-labelledby="h-overdue">
        <div class="mb-4 flex items-center gap-2.5">
          <span class="size-3.5 rounded-full bg-lime" aria-hidden="true"></span>
          <h2 id="h-overdue" class="text-xl font-extrabold text-maroon">Laporan melewati SLA</h2>
          <span
            v-if="data.overdueReports.length"
            class="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white"
          >{{ data.overdueReports.length }}</span>
        </div>

        <ul v-if="data.overdueReports.length" class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <li v-for="report in data.overdueReports" :key="report.id">
            <RouterLink
              :to="{ name: 'admin-detail-laporan', params: { id: report.id } }"
              class="flex h-full flex-col gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 transition-transform hover:-translate-y-0.5"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="rounded-lg bg-white px-3 py-1.5 text-sm font-extrabold tracking-wide text-maroon">{{ report.trackingCode }}</span>
                <span class="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white">
                  {{ report.overdueDays === null ? 'Terlewat' : `Terlewat ${report.overdueDays} hari` }}
                </span>
              </div>
              <StatusBadge :status="report.status" class="self-start" />
              <div class="space-y-1 text-sm text-maroon">
                <p class="flex items-center gap-2"><Building2 class="size-4 shrink-0" aria-hidden="true" />{{ report.agency?.name ?? 'Belum ditentukan' }}</p>
                <p class="flex items-center gap-2"><MapPin class="size-4 shrink-0" aria-hidden="true" />{{ report.district?.name ?? '-' }}</p>
              </div>
            </RouterLink>
          </li>
        </ul>
        <p v-else class="flex items-center gap-3 rounded-2xl border border-lime-dark/40 bg-lime/25 px-5 py-4 text-sm font-semibold text-maroon">
          <span class="flex size-8 items-center justify-center rounded-full bg-lime text-maroon-dark" aria-hidden="true"><Check class="size-4" /></span>
          Tidak ada laporan yang melewati SLA.
        </p>
      </section>

      <!-- Status & tren -->
      <div class="grid gap-4 lg:grid-cols-2">
        <section :class="panelClass" aria-labelledby="h-status">
          <h2 id="h-status" class="text-lg font-extrabold text-maroon">Laporan per status</h2>
          <ul class="mt-5 space-y-3">
            <li v-for="row in statusRows" :key="row.status" class="grid grid-cols-[8.5rem_1fr_2.5rem] items-center gap-3 text-sm sm:grid-cols-[10rem_1fr_3rem]">
              <span class="truncate font-semibold text-maroon">{{ statusLabel(row.status) }}</span>
              <span class="h-3 overflow-hidden rounded-full bg-white" aria-hidden="true">
                <span class="block h-full rounded-full transition-[width] duration-700 ease-out" :class="row.bar" :style="{ width: statusWidth(row.count) }"></span>
              </span>
              <span class="text-right font-extrabold tabular-nums text-maroon">{{ row.count }}</span>
            </li>
          </ul>
        </section>

        <section :class="panelClass" aria-labelledby="h-trend">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="h-trend" class="text-lg font-extrabold text-maroon">Laporan masuk, {{ data.trend.length }} hari terakhir</h2>
            <p class="text-sm font-semibold text-maroon/70">Total {{ trendTotal }}</p>
          </div>
          <div
            class="mt-5 flex h-40 items-end gap-[3px] rounded-xl bg-white px-3 pb-3 pt-4"
            role="img"
            :aria-label="`Total ${trendTotal} laporan masuk dalam ${data.trend.length} hari terakhir`"
          >
            <span
              v-for="(day, i) in data.trend"
              :key="day.date"
              class="min-w-[3px] flex-1 rounded-t-md transition-[height,background-color] duration-700 ease-out hover:bg-maroon"
              :class="i === data.trend.length - 1 ? 'bg-maroon' : 'bg-lime'"
              :style="{ height: barHeight(day.count) }"
              :title="`${day.date}: ${day.count} laporan`"
            ></span>
          </div>
          <p class="mt-3 flex justify-between text-xs font-semibold text-maroon/70">
            <span>{{ formatDate(data.trend[0].date) }}</span>
            <span>{{ formatDate(data.trend[data.trend.length - 1].date) }}</span>
          </p>
        </section>
      </div>

      <!-- Kinerja per instansi -->
      <section aria-labelledby="h-agency">
        <div class="mb-4 flex items-center gap-2.5">
          <span class="size-3.5 rounded-full bg-lime" aria-hidden="true"></span>
          <h2 id="h-agency" class="text-xl font-extrabold text-maroon">Kinerja per instansi</h2>
        </div>

        <ul v-if="agencyRows.length" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <li v-for="agency in agencyRows" :key="agency.id">
            <article
              class="flex h-full flex-col gap-4 rounded-2xl border p-5"
              :class="agency.isActive ? 'border-sand-dark bg-sand' : 'border-dashed border-maroon/30 bg-sand/50'"
            >
              <div class="flex items-center gap-4">
                <ProgressRing :value="agency.percentValue" :size="72">
                  <span class="text-sm">{{ agency.percent }}</span>
                </ProgressRing>
                <div class="min-w-0">
                  <h3 class="break-words font-extrabold leading-tight text-maroon">{{ agency.name }}</h3>
                  <p class="mt-1 text-xs font-semibold text-maroon/70">selesai dari {{ agency.total }} laporan</p>
                  <BaseBadge v-if="!agency.isActive" variant="neutral" class="mt-1.5">Nonaktif</BaseBadge>
                </div>
              </div>

              <dl class="grid grid-cols-3 gap-2 text-center">
                <div class="rounded-xl bg-white px-2 py-2.5">
                  <dd class="text-lg font-extrabold text-maroon">{{ agency.resolved }}</dd>
                  <dt class="text-[11px] font-semibold text-maroon/70">Selesai</dt>
                </div>
                <div class="rounded-xl px-2 py-2.5" :class="agency.overdue > 0 ? 'bg-red-600 text-white' : 'bg-white text-maroon'">
                  <dd class="text-lg font-extrabold">{{ agency.overdue }}</dd>
                  <dt class="text-[11px] font-semibold opacity-80">Lewat SLA</dt>
                </div>
                <div class="rounded-xl bg-white px-2 py-2.5">
                  <dd class="text-lg font-extrabold text-maroon">{{ agency.avgResolutionDays ?? '-' }}</dd>
                  <dt class="text-[11px] font-semibold text-maroon/70">Rata-rata hari</dt>
                </div>
              </dl>
            </article>
          </li>
        </ul>
        <p v-else class="rounded-2xl border border-sand-dark bg-sand px-5 py-4 text-sm font-semibold text-maroon/70">Belum ada instansi.</p>
      </section>

      <!-- Kecamatan terbanyak -->
      <section aria-labelledby="h-district">
        <div class="mb-4 flex items-center gap-2.5">
          <span class="size-3.5 rounded-full bg-lime" aria-hidden="true"></span>
          <h2 id="h-district" class="text-xl font-extrabold text-maroon">Kecamatan dengan laporan terbanyak</h2>
        </div>

        <ol v-if="data.byDistrict.length" :class="[panelClass, 'space-y-3']">
          <li v-for="(district, i) in data.byDistrict" :key="district.id" class="grid grid-cols-[2rem_minmax(0,9rem)_1fr_2.5rem] items-center gap-3 text-sm sm:grid-cols-[2rem_12rem_1fr_3rem]">
            <span
              class="flex size-8 items-center justify-center rounded-full text-sm font-extrabold"
              :class="i < 3 ? 'bg-lime text-maroon-dark' : 'bg-white text-maroon'"
            >{{ i + 1 }}</span>
            <span class="truncate font-semibold text-maroon">{{ district.name }}</span>
            <span class="h-2.5 overflow-hidden rounded-full bg-white" aria-hidden="true">
              <span class="block h-full rounded-full bg-maroon transition-[width] duration-700 ease-out" :style="{ width: districtWidth(district.total) }"></span>
            </span>
            <span class="text-right font-extrabold tabular-nums text-maroon">{{ district.total }}</span>
          </li>
        </ol>
        <p v-else class="rounded-2xl border border-sand-dark bg-sand px-5 py-4 text-sm font-semibold text-maroon/70">Belum ada data kecamatan.</p>
      </section>
    </div>
  </section>
</template>