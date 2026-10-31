<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { assetUrl } from '@/api'
import { adminApi } from '@/api/admin.api'
import { useMasterOptions } from '@/composables/useMasterOptions'
import { useToast } from '@/composables/useToast'
import { REPORT_STATUS } from '@/constants/status'
import { formatDate, formatDateTime } from '@/utils/formatDate'
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
</script>

<template>
  <section class="container admin-page">
    <RouterLink :to="{ name: 'admin-kelola-laporan' }" class="back">Kembali ke daftar laporan</RouterLink>

    <BaseLoading v-if="loading" text="Memuat laporan..." />
    <p v-else-if="error && !report" class="alert alert--error" role="alert">{{ error }}</p>

    <template v-else-if="report">
      <header class="page-header">
        <div class="row">
          <h1>{{ report.trackingCode }}</h1>
          <StatusBadge :status="report.status" />
          <span v-if="report.admin.sla.isOverdue" class="tag tag--danger">Melewati SLA</span>
        </div>
      </header>

      <p v-if="error" class="alert alert--error" role="alert">{{ error }}</p>
      <p v-if="mergedInto" class="alert alert--info">
        Laporan ini sudah digabung ke
        <RouterLink :to="{ name: 'admin-detail-laporan', params: { id: mergedInto.id } }" class="link">{{ mergedInto.trackingCode }}</RouterLink>.
      </p>
      <p v-else-if="report.admin.mergedReportCount" class="alert alert--info">
        {{ report.admin.mergedReportCount }} laporan duplikat sudah digabung ke laporan ini.
      </p>

      <div class="panel">
        <h2>Detail laporan</h2>
        <p v-if="category" class="muted">{{ category }}</p>
        <p>{{ report.description }}</p>

        <dl class="facts">
          <div v-if="location">
            <dt>Lokasi</dt>
            <dd>{{ location }} <a :href="mapUrl" target="_blank" rel="noopener" class="link">Buka di peta</a></dd>
          </div>
          <div>
            <dt>Pelapor</dt>
            <dd>
              {{ report.admin.reporter.name }}
              <span v-if="report.isAnonymous" class="tag tag--warn">Anonim di publik</span>
              <br /><span class="muted">{{ report.admin.reporter.email }}</span>
            </dd>
          </div>
          <div>
            <dt>Dilaporkan</dt>
            <dd>{{ formatDateTime(report.createdAt) }}</dd>
          </div>
          <div>
            <dt>Instansi</dt>
            <dd>{{ report.agency?.name ?? 'Belum ditentukan' }}</dd>
          </div>
          <div>
            <dt>Batas SLA tahap ini</dt>
            <dd><SlaTag :sla="report.admin.sla" /></dd>
          </div>
          <div v-if="report.admin.resolvedAt">
            <dt>Selesai</dt>
            <dd>{{ formatDate(report.admin.resolvedAt) }}</dd>
          </div>
          <div v-if="report.reopenCount">
            <dt>Dibuka kembali</dt>
            <dd>{{ report.reopenCount }} kali</dd>
          </div>
          <div v-if="report.rejectionReason">
            <dt>Alasan penolakan</dt>
            <dd>{{ report.rejectionReason }}</dd>
          </div>
          <div>
            <dt>Interaksi</dt>
            <dd>{{ report.stats.upvotes }} dukungan, {{ report.stats.verifications }} verifikasi, {{ report.stats.comments }} komentar</dd>
          </div>
        </dl>

        <template v-if="report.photos?.length">
          <h3>Foto laporan</h3>
          <ul class="thumbs">
            <li v-for="photo in report.photos" :key="photo.id">
              <a :href="assetUrl(photo.url)" target="_blank" rel="noopener">
                <img :src="assetUrl(photo.url)" :alt="`Foto laporan ${report.trackingCode}`" loading="lazy" />
              </a>
            </li>
          </ul>
        </template>
      </div>

      <div v-if="canVerify" class="panel">
        <h2>Verifikasi</h2>
        <VerifyForm :report="report" :agencies="agencies" @updated="handleVerified" />
      </div>

      <div v-if="canMerge" class="panel">
        <h2>Gabungkan duplikat</h2>
        <DuplicatePanel :report-id="report.id" @merged="handleMerged" />
      </div>

      <div class="panel">
        <h2>Riwayat progres</h2>
        <ProgressTimeline :items="report.timeline ?? []" />
      </div>
    </template>
  </section>
</template>

<style scoped>
.back { display: inline-block; margin-bottom: 1rem; color: var(--color-primary); }
.link { color: var(--color-primary); text-decoration: underline; }
h3 { margin: 1rem 0 0.5rem; font-size: 1rem; }
</style>