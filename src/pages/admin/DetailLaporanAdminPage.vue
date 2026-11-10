<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Activity,
  AlignLeft,
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  CircleCheck,
  CircleX,
  Clock,
  ExternalLink,
  FileText,
  GitMerge,
  Landmark,
  MapPin,
  Paperclip,
  Send,
  ShieldCheck,
  Timer,
  User,
  Wrench,
  X,
} from 'lucide-vue-next'
import { assetUrl } from '@/api'
import { adminApi } from '@/api/admin.api'
import { useMasterOptions } from '@/composables/useMasterOptions'
import { useToast } from '@/composables/useToast'
import { REPORT_STATUS, STATUS_META } from '@/constants/status'
import { formatDate, formatDateTime } from '@/utils/formatDate'
import { humanizeEnum } from '@/utils/formatStatus'
import BaseLoading from '@/components/common/BaseLoading.vue'
import DuplicatePanel from '@/components/admin/DuplicatePanel.vue'
import SlaTag from '@/components/admin/SlaTag.vue'
import VerifyForm from '@/components/admin/VerifyForm.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { agencies } = useMasterOptions(['agencies'])

const report = ref(null)
const loading = ref(true)
const error = ref('')

let requestId = 0 // respons milik request lama dibuang
async function fetchReport({ silent = false } = {}) {
  const id = ++requestId
  if (!silent) loading.value = true
  error.value = ''
  try {
    const { data: body } = await adminApi.detailLaporan(route.params.id)
    if (id !== requestId) return
    report.value = body.data
  } catch (e) {
    if (id !== requestId) return
    if (!silent) report.value = null
    error.value = e.normalized?.status === 404 ? 'Laporan tidak ditemukan.' : (e.normalized?.message ?? 'Gagal memuat laporan.')
  } finally {
    if (id === requestId && !silent) loading.value = false
  }
}

// Saat pindah ke halaman lain, params.id sempat kosong; jangan ikut memuat.
watch(
  () => route.params.id,
  (id) => id && fetchReport(),
  { immediate: true },
)

const mergedInto = computed(() => report.value?.admin.mergedInto ?? null)
const canVerify = computed(
  () =>
    !mergedInto.value &&
    [REPORT_STATUS.MENUNGGU_VERIFIKASI, REPORT_STATUS.TERVERIFIKASI].includes(report.value.status),
)
const canMerge = computed(() => !mergedInto.value)

const category = computed(() => {
  const sub = report.value?.subcategory
  if (!sub) return ''
  return sub.category?.name ? `${sub.category.name} › ${sub.name}` : sub.name
})
const location = computed(() => [report.value?.address, report.value?.district?.name].filter(Boolean).join(', '))
const mapUrl = computed(
  () => `https://www.google.com/maps?q=${Number(report.value.latitude)},${Number(report.value.longitude)}`,
)

const VERIFIED_MESSAGE = {
  VERIFIKASI: 'Laporan diverifikasi.',
  TERUSKAN: 'Laporan diteruskan ke instansi.',
  TOLAK: 'Laporan ditolak.',
}
async function handleVerified(action) {
  toast.success(VERIFIED_MESSAGE[action] ?? 'Laporan diperbarui.')
  await fetchReport({ silent: true })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function handleMerged(target) {
  toast.success('Laporan berhasil digabung.')
  router.push({ name: 'admin-detail-laporan', params: { id: target.id } })
}

// ---- Tampilan ----
const SUBTITLE = {
  [REPORT_STATUS.MENUNGGU_VERIFIKASI]: 'Laporan menunggu verifikasi admin.',
  [REPORT_STATUS.TERVERIFIKASI]: 'Laporan sudah diverifikasi dan siap diteruskan ke instansi.',
  [REPORT_STATUS.DITOLAK]: 'Laporan ditolak oleh admin.',
  [REPORT_STATUS.DITERUSKAN]: 'Laporan sudah diteruskan dan menunggu ditangani instansi.',
  [REPORT_STATUS.DALAM_PENANGANAN]: 'Laporan sedang ditangani oleh instansi.',
  [REPORT_STATUS.SELESAI]: 'Laporan sudah selesai ditangani.',
}
const subtitle = computed(() => SUBTITLE[report.value?.status] ?? '')

// Pil status di judul: warna + ikon per status.
const PILL = {
  [REPORT_STATUS.MENUNGGU_VERIFIKASI]: { tone: 'bg-amber-200 text-amber-950', icon: Clock },
  [REPORT_STATUS.TERVERIFIKASI]: { tone: 'bg-lime text-maroon', icon: CircleCheck },
  [REPORT_STATUS.DITOLAK]: { tone: 'bg-red-200 text-red-900', icon: CircleX },
  [REPORT_STATUS.DITERUSKAN]: { tone: 'bg-violet-200 text-violet-900', icon: Send },
  [REPORT_STATUS.DALAM_PENANGANAN]: { tone: 'bg-blue-200 text-blue-900', icon: Wrench },
  [REPORT_STATUS.SELESAI]: { tone: 'bg-lime text-maroon', icon: CircleCheck },
}
const pill = computed(() => PILL[report.value?.status] ?? { tone: 'bg-sand-dark text-maroon', icon: Clock })
const statusText = computed(() => STATUS_META[report.value?.status]?.label ?? report.value?.status)

// Riwayat: judul tahap + penanda tahap berjalan (entri terakhir).
const STEP_TITLE = {
  [REPORT_STATUS.MENUNGGU_VERIFIKASI]: 'Laporan diterima',
  [REPORT_STATUS.TERVERIFIKASI]: 'Laporan diverifikasi',
  [REPORT_STATUS.DITOLAK]: 'Laporan ditolak',
  [REPORT_STATUS.DITERUSKAN]: 'Diteruskan ke instansi',
  [REPORT_STATUS.DALAM_PENANGANAN]: 'Ditindaklanjuti',
  [REPORT_STATUS.SELESAI]: 'Selesai',
}
const steps = computed(() =>
  (report.value?.timeline ?? []).map((item, index, list) => ({
    id: item.id,
    title:
      item.fromStatus && item.fromStatus === item.toStatus
        ? 'Catatan progres'
        : (STEP_TITLE[item.toStatus] ?? STATUS_META[item.toStatus]?.label ?? item.toStatus),
    at: item.createdAt,
    by: item.actor?.name ?? 'Sistem',
    note: item.note,
    rejected: item.toStatus === REPORT_STATUS.DITOLAK,
    current: index === list.length - 1,
  })),
)

// Tindak lanjut instansi diambil dari riwayat yang ditulis petugas dan punya catatan atau lampiran.
// Kosong = kartunya tidak tampil.
const followUps = computed(() =>
  (report.value?.timeline ?? []).filter(
    (item) => item.actor?.role === 'INSTANSI' && (item.note || item.attachments?.length),
  ),
)
const isImage = (attachment) => /\.(jpe?g|png|webp|gif)$/i.test(attachment.url || attachment.fileName || '')

// Gaya bersama (Tailwind, token moodboard)
const cardClass = 'rounded-3xl border border-sand-dark/70 bg-white/60 p-5 shadow-sm sm:p-6'
const iconClass = 'grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sand text-maroon'
const cardTitleClass = 'text-lg font-extrabold text-maroon'
const labelClass = 'text-sm text-maroon/70'
const valueClass = 'mt-0.5 text-sm font-semibold text-maroon'
</script>

<template>
  <section class="relative isolate mx-auto w-full max-w-[90rem] overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
    <!-- Hiasan latar -->
    <div aria-hidden="true" class="pointer-events-none absolute -right-24 top-20 -z-10 h-80 w-80 rounded-full bg-lime/20 blur-3xl"></div>
    <div aria-hidden="true" class="pointer-events-none absolute -left-24 bottom-10 -z-10 h-72 w-72 rounded-full bg-sand-dark/50 blur-3xl"></div>

    <RouterLink
      :to="{ name: 'admin-kelola-laporan' }"
      class="inline-flex items-center gap-2 rounded-full border border-sand-dark bg-white/80 px-4 py-2 text-sm font-semibold text-maroon hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
    >
      <ArrowLeft class="h-4 w-4" aria-hidden="true" /> Kembali ke daftar laporan
    </RouterLink>

    <BaseLoading v-if="loading" text="Memuat laporan..." />
    <p v-else-if="error && !report" class="mt-4 rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-800" role="alert">{{ error }}</p>

    <template v-else-if="report">
      <header class="mb-6 mt-5 flex flex-wrap items-start justify-between gap-4">
        <div class="flex items-start gap-3">
          <svg class="mt-1 h-10 w-10 shrink-0 text-lime-dark" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" aria-hidden="true">
            <path d="M4 33 L16 30" />
            <path d="M6 22 L17 16" />
            <path d="M15 11 L21 3" />
          </svg>
          <div>
            <div class="flex flex-wrap items-center gap-3">
              <h1 class="text-4xl font-extrabold tracking-tight text-maroon">Detail Laporan</h1>
              <span class="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold" :class="pill.tone">
                <component :is="pill.icon" class="h-4 w-4" aria-hidden="true" /> {{ statusText }}
              </span>
            </div>
            <p v-if="subtitle" class="mt-1 text-maroon/70">{{ subtitle }}</p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 rounded-2xl border border-sand-dark bg-white/70 px-4 py-2.5 text-sm text-maroon">
          <Timer class="h-4 w-4" aria-hidden="true" />
          <span class="font-semibold">Batas SLA</span>
          <SlaTag :sla="report.admin.sla" />
          <span v-if="report.admin.sla.isOverdue" class="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
            Melewati SLA
          </span>
        </div>
      </header>

      <p v-if="error" class="mb-4 rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-800" role="alert">{{ error }}</p>
      <p v-if="mergedInto" class="mb-4 rounded-2xl border border-sand-dark bg-sand px-4 py-3 text-sm text-maroon">
        Laporan ini sudah digabung ke
        <RouterLink
          :to="{ name: 'admin-detail-laporan', params: { id: mergedInto.id } }"
          class="font-semibold text-blue-700 underline underline-offset-2"
        >
          {{ mergedInto.trackingCode }}
        </RouterLink>.
      </p>
      <p
        v-else-if="report.admin.mergedReportCount"
        class="mb-4 rounded-2xl border border-sand-dark bg-sand px-4 py-3 text-sm text-maroon"
      >
        {{ report.admin.mergedReportCount }} laporan duplikat sudah digabung ke laporan ini.
      </p>

      <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <!-- Kolom kiri -->
        <div class="grid gap-6">
          <!-- Informasi laporan: foto kiri, data kanan -->
          <section class="flex flex-col overflow-hidden rounded-3xl border border-sand-dark/70 bg-white/60 p-3 shadow-sm sm:flex-row" aria-label="Informasi laporan">
            <div v-if="report.photos?.length" class="sm:w-[42%] sm:shrink-0">
              <a :href="assetUrl(report.photos[0].url)" target="_blank" rel="noopener" class="block h-full">
                <img
                  :src="assetUrl(report.photos[0].url)"
                  :alt="`Foto laporan ${report.trackingCode}`"
                  class="aspect-[4/3] h-full min-h-56 w-full rounded-2xl object-cover sm:aspect-auto"
                />
              </a>
            </div>

            <dl
              class="grid min-w-0 flex-1 content-center gap-5 p-3 sm:p-6"
              :class="report.photos?.length ? 'sm:ml-3 sm:border-l sm:border-sand-dark sm:pl-8' : ''"
            >
              <div class="flex items-start gap-3">
                <span :class="[iconClass, '!h-9 !w-9']"><FileText class="h-4 w-4" aria-hidden="true" /></span>
                <div class="min-w-0">
                  <dt :class="labelClass">Kode Laporan</dt>
                  <dd class="text-2xl font-extrabold text-maroon">{{ report.trackingCode }}</dd>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <span :class="[iconClass, '!h-9 !w-9']"><Calendar class="h-4 w-4" aria-hidden="true" /></span>
                <div class="min-w-0">
                  <dt :class="labelClass">Tanggal Lapor</dt>
                  <dd class="text-lg font-extrabold text-maroon">{{ formatDateTime(report.createdAt) }}</dd>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <span :class="[iconClass, '!h-9 !w-9']"><User class="h-4 w-4" aria-hidden="true" /></span>
                <div class="min-w-0">
                  <dt :class="labelClass">Pelapor</dt>
                  <dd :class="valueClass">
                    {{ report.admin.reporter.name }}
                    <span v-if="report.isAnonymous" class="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                      Anonim di publik
                    </span>
                    <span class="block break-all text-sm font-normal text-maroon/70">{{ report.admin.reporter.email }}</span>
                  </dd>
                </div>
              </div>

              <div v-if="location" class="flex items-start gap-3">
                <span :class="[iconClass, '!h-9 !w-9']"><MapPin class="h-4 w-4" aria-hidden="true" /></span>
                <div class="min-w-0">
                  <dt :class="labelClass">Lokasi</dt>
                  <dd :class="valueClass">
                    {{ location }}
                    <a
                      :href="mapUrl"
                      target="_blank"
                      rel="noopener"
                      class="ml-1 inline-flex items-center gap-1 font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900"
                    >
                      Buka di peta <ExternalLink class="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </dd>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <span :class="[iconClass, '!h-9 !w-9']"><Building2 class="h-4 w-4" aria-hidden="true" /></span>
                <div class="min-w-0">
                  <dt :class="labelClass">Instansi</dt>
                  <dd :class="valueClass">{{ report.agency?.name ?? 'Belum ditentukan' }}</dd>
                </div>
              </div>

              <ul v-if="report.photos?.length > 1" class="flex flex-wrap gap-2" aria-label="Foto lainnya">
                <li v-for="photo in report.photos.slice(1)" :key="photo.id">
                  <a :href="assetUrl(photo.url)" target="_blank" rel="noopener">
                    <img
                      :src="assetUrl(photo.url)"
                      :alt="`Foto tambahan ${report.trackingCode}`"
                      loading="lazy"
                      class="h-14 w-20 rounded-xl border border-sand-dark object-cover"
                    />
                  </a>
                </li>
              </ul>
            </dl>
          </section>

          <section :class="[cardClass, 'flex gap-4']" aria-labelledby="sec-desc">
            <span :class="iconClass"><AlignLeft class="h-5 w-5" aria-hidden="true" /></span>
            <div class="min-w-0">
              <h2 id="sec-desc" :class="cardTitleClass">Deskripsi Laporan</h2>
              <p v-if="category" class="mt-1 text-sm font-semibold text-maroon/70">{{ category }}</p>
              <p class="mt-2 whitespace-pre-line leading-relaxed text-maroon">{{ report.description }}</p>
            </div>
          </section>

          <section v-if="followUps.length" :class="[cardClass, 'flex gap-4']" aria-labelledby="sec-followup">
            <span :class="iconClass"><MapPin class="h-5 w-5" aria-hidden="true" /></span>
            <div class="min-w-0 flex-1">
              <h2 id="sec-followup" :class="cardTitleClass">Tindak Lanjut Instansi</h2>
              <ul class="mt-3 grid gap-4">
                <li v-for="item in followUps" :key="item.id" class="flex items-start gap-3">
                  <CircleCheck class="mt-0.5 h-5 w-5 shrink-0 text-lime-dark" aria-hidden="true" />
                  <div class="min-w-0">
                    <p v-if="item.note" class="leading-relaxed text-maroon">{{ item.note }}</p>
                    <p class="mt-0.5 text-xs text-maroon/60">
                      {{ item.actor.name }}, <time :datetime="item.createdAt">{{ formatDateTime(item.createdAt) }}</time>
                    </p>
                    <ul v-if="item.attachments?.length" class="mt-3 flex flex-wrap gap-3">
                      <li v-for="attachment in item.attachments" :key="attachment.id">
                        <a
                          v-if="isImage(attachment)"
                          :href="assetUrl(attachment.url)"
                          target="_blank"
                          rel="noopener"
                          class="block overflow-hidden rounded-xl border border-sand-dark hover:border-maroon"
                        >
                          <img
                            :src="assetUrl(attachment.url)"
                            :alt="`Lampiran ${humanizeEnum(attachment.kind)}`"
                            loading="lazy"
                            class="block h-24 w-32 object-cover"
                          />
                        </a>
                        <a
                          v-else
                          :href="assetUrl(attachment.url)"
                          target="_blank"
                          rel="noopener"
                          class="inline-flex items-center gap-2 rounded-full border border-sand-dark bg-cream px-4 py-2 text-sm font-semibold text-maroon hover:bg-sand"
                        >
                          <Paperclip class="h-4 w-4" aria-hidden="true" />
                          <span class="max-w-48 truncate">{{ attachment.fileName || humanizeEnum(attachment.kind) }}</span>
                          <span class="text-blue-700 underline underline-offset-2">Lihat file</span>
                        </a>
                      </li>
                    </ul>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          <section v-if="canVerify" :class="cardClass" aria-labelledby="sec-verify">
            <div class="mb-4 flex items-center gap-3">
              <span :class="iconClass"><ShieldCheck class="h-5 w-5" aria-hidden="true" /></span>
              <h2 id="sec-verify" :class="cardTitleClass">Verifikasi</h2>
            </div>
            <VerifyForm :report="report" :agencies="agencies" @updated="handleVerified" />
          </section>

          <section v-if="canMerge" :class="cardClass" aria-labelledby="sec-merge">
            <div class="mb-4 flex items-center gap-3">
              <span :class="iconClass"><GitMerge class="h-5 w-5" aria-hidden="true" /></span>
              <h2 id="sec-merge" :class="cardTitleClass">Gabungkan duplikat</h2>
            </div>
            <DuplicatePanel :report-id="report.id" @merged="handleMerged" />
          </section>
        </div>

        <!-- Kolom kanan -->
        <div class="grid gap-6">
          <section :class="[cardClass, 'relative overflow-hidden']" aria-labelledby="sec-history">
            <div aria-hidden="true" class="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-lime/40 blur-2xl"></div>
            <div class="relative mb-5 flex items-center gap-3">
              <span :class="iconClass"><Activity class="h-5 w-5" aria-hidden="true" /></span>
              <h2 id="sec-history" :class="cardTitleClass">Status &amp; Riwayat</h2>
            </div>

            <ol v-if="steps.length" class="relative">
              <li v-for="(step, index) in steps" :key="step.id" class="relative pl-12" :class="index < steps.length - 1 ? 'pb-6' : ''">
                <span
                  v-if="index < steps.length - 1"
                  class="absolute bottom-0 left-4 top-8 w-0.5 -translate-x-1/2 bg-lime"
                  aria-hidden="true"
                ></span>
                <span
                  class="absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full"
                  :class="
                    step.rejected
                      ? 'bg-red-500 text-white'
                      : step.current
                        ? 'bg-maroon text-lime ring-4 ring-maroon/15'
                        : 'bg-lime text-maroon'
                  "
                  aria-hidden="true"
                >
                  <X v-if="step.rejected" class="h-4 w-4" />
                  <Check v-else class="h-4 w-4" />
                </span>
                <p class="font-extrabold leading-8 text-maroon">{{ step.title }}</p>
                <time class="-mt-1 block text-sm text-maroon/70" :datetime="step.at">{{ formatDateTime(step.at) }}</time>
                <p class="text-sm text-maroon/70">Oleh {{ step.by }}</p>
                <p v-if="step.note" class="mt-1 text-sm leading-relaxed text-maroon/80">{{ step.note }}</p>
              </li>
            </ol>
            <p v-else class="text-sm text-maroon/60">Belum ada riwayat progres.</p>
          </section>

          <section :class="cardClass" aria-labelledby="sec-extra">
            <div class="mb-5 flex items-center gap-3">
              <span :class="iconClass"><Landmark class="h-5 w-5" aria-hidden="true" /></span>
              <h2 id="sec-extra" :class="cardTitleClass">Informasi Tambahan</h2>
            </div>
            <div class="grid grid-cols-2">
              <dl class="grid content-start gap-4 pr-4">
                <div>
                  <dt :class="labelClass">Kecamatan</dt>
                  <dd :class="valueClass">{{ report.district?.name ?? '-' }}</dd>
                </div>
                <div>
                  <dt :class="labelClass">Jenis laporan</dt>
                  <dd :class="valueClass">{{ report.subcategory?.name ?? '-' }}</dd>
                </div>
                <div>
                  <dt :class="labelClass">Interaksi</dt>
                  <dd :class="valueClass">
                    <span class="block">{{ report.stats.upvotes }} dukungan</span>
                    <span class="block">{{ report.stats.verifications }} verifikasi</span>
                    <span class="block">{{ report.stats.comments }} komentar</span>
                  </dd>
                </div>
              </dl>
              <dl class="grid content-start gap-4 border-l border-sand-dark pl-5">
                <div>
                  <dt :class="labelClass">Kategori</dt>
                  <dd :class="valueClass">{{ report.subcategory?.category?.name ?? '-' }}</dd>
                </div>
                <div>
                  <dt :class="labelClass">Terakhir diperbarui</dt>
                  <dd :class="valueClass">{{ formatDateTime(report.updatedAt) }}</dd>
                </div>
                <div v-if="report.admin.resolvedAt">
                  <dt :class="labelClass">Selesai</dt>
                  <dd :class="valueClass">{{ formatDate(report.admin.resolvedAt) }}</dd>
                </div>
                <div v-if="report.reopenCount">
                  <dt :class="labelClass">Dibuka kembali</dt>
                  <dd :class="valueClass">{{ report.reopenCount }} kali</dd>
                </div>
              </dl>
            </div>
            <div v-if="report.rejectionReason" class="mt-5 border-t border-sand-dark pt-4">
              <p :class="labelClass">Alasan penolakan</p>
              <p :class="valueClass">{{ report.rejectionReason }}</p>
            </div>
          </section>
        </div>
      </div>
    </template>
  </section>
</template>