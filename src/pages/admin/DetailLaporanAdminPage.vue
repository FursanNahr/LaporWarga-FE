<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ExternalLink, MapPin, Paperclip } from 'lucide-vue-next'
import { assetUrl } from '@/api'
import { adminApi } from '@/api/admin.api'
import { useMasterOptions } from '@/composables/useMasterOptions'
import { useToast } from '@/composables/useToast'
import { REPORT_STATUS } from '@/constants/status'
import { formatDate, formatDateTime } from '@/utils/formatDate'
import { humanizeEnum } from '@/utils/formatStatus'
import BaseLoading from '@/components/common/BaseLoading.vue'
import DuplicatePanel from '@/components/admin/DuplicatePanel.vue'
import SlaTag from '@/components/admin/SlaTag.vue'
import VerifyForm from '@/components/admin/VerifyForm.vue'
import ProgressTimeline from '@/components/laporan/ProgressTimeline.vue'
import StatusBadge from '@/components/laporan/StatusBadge.vue'

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

// Tindak lanjut instansi diambil dari riwayat progres yang ditulis petugas dan punya catatan atau lampiran.
// Kosong = kartunya tidak tampil.
const followUps = computed(() =>
  (report.value?.timeline ?? []).filter(
    (item) => item.actor?.role === 'INSTANSI' && (item.note || item.attachments?.length),
  ),
)
const isImage = (attachment) => /\.(jpe?g|png|webp|gif)$/i.test(attachment.url || attachment.fileName || '')

// Gaya bersama (Tailwind, token moodboard)
const cardClass = 'rounded-3xl border border-sand-dark bg-white/70 p-5 sm:p-6'
const cardTitleClass = 'mb-4 text-lg font-extrabold text-maroon'
const labelClass = 'text-xs font-semibold text-maroon/60'
const valueClass = 'mt-0.5 text-sm font-medium text-maroon'
</script>

<template>
  <section class="mx-auto w-full max-w-[90rem] px-4 py-6 sm:px-6 lg:px-8">
    <RouterLink
      :to="{ name: 'admin-kelola-laporan' }"
      class="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
    >
      <ArrowLeft class="h-4 w-4" aria-hidden="true" /> Kembali ke daftar laporan
    </RouterLink>

    <BaseLoading v-if="loading" text="Memuat laporan..." />
    <p v-else-if="error && !report" class="mt-4 rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-800" role="alert">{{ error }}</p>

    <template v-else-if="report">
      <header class="mb-6 mt-3">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-3xl font-extrabold tracking-tight text-maroon">Detail Laporan</h1>
          <StatusBadge :status="report.status" />
          <span v-if="report.admin.sla.isOverdue" class="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
            Melewati SLA
          </span>
        </div>
        <p v-if="subtitle" class="mt-1 text-maroon/70">{{ subtitle }}</p>
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

      <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <!-- Kolom kiri -->
        <div class="grid gap-6">
          <section :class="cardClass" aria-labelledby="sec-info">
            <h2 id="sec-info" :class="cardTitleClass">Informasi Laporan</h2>
            <div class="flex flex-col gap-5 sm:flex-row">
              <div v-if="report.photos?.length" class="sm:w-64 sm:shrink-0">
                <a :href="assetUrl(report.photos[0].url)" target="_blank" rel="noopener" class="block">
                  <img
                    :src="assetUrl(report.photos[0].url)"
                    :alt="`Foto laporan ${report.trackingCode}`"
                    class="aspect-[4/3] w-full rounded-2xl border border-sand-dark object-cover"
                  />
                </a>
                <ul v-if="report.photos.length > 1" class="mt-2 flex flex-wrap gap-2">
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
              </div>

              <dl class="grid min-w-0 flex-1 content-start gap-x-6 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt :class="labelClass">Kode Laporan</dt>
                  <dd class="mt-0.5 text-xl font-extrabold text-maroon">{{ report.trackingCode }}</dd>
                </div>
                <div>
                  <dt :class="labelClass">Tanggal Lapor</dt>
                  <dd :class="valueClass">{{ formatDateTime(report.createdAt) }}</dd>
                </div>
                <div>
                  <dt :class="labelClass">Pelapor</dt>
                  <dd :class="valueClass">
                    {{ report.admin.reporter.name }}
                    <span v-if="report.isAnonymous" class="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                      Anonim di publik
                    </span>
                    <span class="block break-all font-normal text-maroon/70">{{ report.admin.reporter.email }}</span>
                  </dd>
                </div>
                <div>
                  <dt :class="labelClass">Instansi</dt>
                  <dd :class="valueClass">{{ report.agency?.name ?? 'Belum ditentukan' }}</dd>
                </div>
                <div v-if="location" class="sm:col-span-2">
                  <dt :class="labelClass">Lokasi</dt>
                  <dd :class="valueClass" class="flex flex-wrap items-start gap-x-3 gap-y-1">
                    <span class="inline-flex items-start gap-1.5">
                      <MapPin class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {{ location }}
                    </span>
                    <a
                      :href="mapUrl"
                      target="_blank"
                      rel="noopener"
                      class="inline-flex items-center gap-1 font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900"
                    >
                      Buka di peta <ExternalLink class="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <section :class="cardClass" aria-labelledby="sec-desc">
            <h2 id="sec-desc" class="mb-2 text-lg font-extrabold text-maroon">Deskripsi Laporan</h2>
            <p v-if="category" class="mb-2 text-sm font-semibold text-maroon/70">{{ category }}</p>
            <p class="whitespace-pre-line leading-relaxed text-maroon">{{ report.description }}</p>
          </section>

          <section v-if="followUps.length" :class="cardClass" aria-labelledby="sec-followup">
            <h2 id="sec-followup" :class="cardTitleClass">Tindak Lanjut Instansi</h2>
            <ul class="grid gap-5">
              <li v-for="item in followUps" :key="item.id">
                <p v-if="item.note" class="text-sm leading-relaxed text-maroon">{{ item.note }}</p>
                <p class="mt-1 text-xs text-maroon/60">
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
              </li>
            </ul>
          </section>

          <section v-if="canVerify" :class="cardClass" aria-labelledby="sec-verify">
            <h2 id="sec-verify" :class="cardTitleClass">Verifikasi</h2>
            <div class="admin-page admin-modal">
              <VerifyForm :report="report" :agencies="agencies" @updated="handleVerified" />
            </div>
          </section>

          <section v-if="canMerge" :class="cardClass" aria-labelledby="sec-merge">
            <h2 id="sec-merge" :class="cardTitleClass">Gabungkan duplikat</h2>
            <div class="admin-page admin-modal">
              <DuplicatePanel :report-id="report.id" @merged="handleMerged" />
            </div>
          </section>
        </div>

        <!-- Kolom kanan -->
        <div class="grid gap-6">
          <section :class="cardClass" aria-labelledby="sec-history">
            <h2 id="sec-history" :class="cardTitleClass">Status &amp; Riwayat</h2>
            <div class="text-maroon">
              <ProgressTimeline :items="report.timeline ?? []" variant="card" />
            </div>
          </section>

          <section :class="cardClass" aria-labelledby="sec-extra">
            <h2 id="sec-extra" :class="cardTitleClass">Informasi Tambahan</h2>
            <dl class="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div>
                <dt :class="labelClass">Kecamatan</dt>
                <dd :class="valueClass">{{ report.district?.name ?? '-' }}</dd>
              </div>
              <div>
                <dt :class="labelClass">Kategori</dt>
                <dd :class="valueClass">{{ report.subcategory?.category?.name ?? '-' }}</dd>
              </div>
              <div class="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                <dt :class="labelClass">Jenis laporan</dt>
                <dd :class="valueClass">{{ report.subcategory?.name ?? '-' }}</dd>
              </div>
              <div>
                <dt :class="labelClass">Batas SLA tahap ini</dt>
                <dd :class="valueClass"><SlaTag :sla="report.admin.sla" /></dd>
              </div>
              <div>
                <dt :class="labelClass">Interaksi</dt>
                <dd :class="valueClass">
                  {{ report.stats.upvotes }} dukungan, {{ report.stats.verifications }} verifikasi,
                  {{ report.stats.comments }} komentar
                </dd>
              </div>
              <div v-if="report.admin.resolvedAt">
                <dt :class="labelClass">Selesai</dt>
                <dd :class="valueClass">{{ formatDate(report.admin.resolvedAt) }}</dd>
              </div>
              <div v-if="report.reopenCount">
                <dt :class="labelClass">Dibuka kembali</dt>
                <dd :class="valueClass">{{ report.reopenCount }} kali</dd>
              </div>
              <div v-if="report.rejectionReason" class="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                <dt :class="labelClass">Alasan penolakan</dt>
                <dd :class="valueClass">{{ report.rejectionReason }}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </template>
  </section>
</template>