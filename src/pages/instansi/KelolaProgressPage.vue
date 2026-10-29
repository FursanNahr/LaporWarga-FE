<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { assetUrl } from '@/api'
import { laporanApi } from '@/api/laporan.api'
import { actionsForStatus, REPORT_STATUS } from '@/constants/status'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth.store'
import { formatDate } from '@/utils/formatDate'
import { formatReporter } from '@/utils/formatStatus'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import ProgressTimeline from '@/components/laporan/ProgressTimeline.vue'
import ProgressUpdateForm from '@/components/laporan/ProgressUpdateForm.vue'
import StatusBadge from '@/components/laporan/StatusBadge.vue'

const route = useRoute()
const auth = useAuthStore()
const toast = useToast()

const report = ref(null)
const loading = ref(true)
const error = ref('')

let requestId = 0 // respons milik request lama dibuang
async function fetchReport({ silent = false } = {}) {
  const id = ++requestId
  if (!silent) loading.value = true
  error.value = ''

  try {
    const { data: body } = await laporanApi.detail(route.params.id)
    if (id !== requestId) return
    report.value = body.data
  } catch (e) {
    if (id !== requestId) return
    if (!silent) report.value = null
    error.value =
      e.normalized?.status === 404
        ? 'Laporan tidak ditemukan.'
        : (e.normalized?.message ?? 'Gagal memuat laporan.')
  } finally {
    if (id === requestId && !silent) loading.value = false
  }
}

// Saat pindah ke halaman lain, params.id sempat kosong; jangan ikut memuat.
watch(
  () => route.params.id,
  (id) => {
    if (!id) return
    fetchReport()
  },
  { immediate: true },
)

// Instansi lain hanya boleh melihat. Dicek jika data akun membawa id instansi (BE tetap menolak dengan 404).
const myAgencyId = computed(() => auth.user?.agencyId ?? auth.user?.agency?.id ?? null)
const isOtherAgency = computed(
  () => myAgencyId.value !== null && report.value?.agency?.id !== myAgencyId.value,
)
const canUpdate = computed(
  () => Boolean(report.value) && !isOtherAgency.value && actionsForStatus(report.value.status).length > 0,
)
const isFinished = computed(() => report.value?.status === REPORT_STATUS.SELESAI)

const category = computed(() => {
  const sub = report.value?.subcategory
  if (!sub) return ''
  return sub.category?.name ? `${sub.category.name} › ${sub.name}` : sub.name
})
const location = computed(() =>
  [report.value?.address, report.value?.district?.name].filter(Boolean).join(', '),
)
const mapUrl = computed(() =>
  report.value
    ? `https://www.google.com/maps?q=${Number(report.value.latitude)},${Number(report.value.longitude)}`
    : '',
)

async function handleUpdated() {
  toast.success('Progres berhasil diperbarui.')
  await fetchReport({ silent: true })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <section class="container page">
    <RouterLink :to="{ name: 'instansi-daftar-laporan' }" class="page__back">Kembali ke daftar laporan</RouterLink>

    <BaseLoading v-if="loading" text="Memuat laporan..." />

    <p v-else-if="error && !report" class="page__error" role="alert">{{ error }}</p>

    <template v-else-if="report">
      <header class="page__header">
        <h1>{{ report.trackingCode }}</h1>
        <StatusBadge :status="report.status" />
      </header>

      <p v-if="error" class="page__error" role="alert">{{ error }}</p>

      <BaseCard class="block">
        <h2>Detail laporan</h2>
        <p v-if="category" class="muted">{{ category }}</p>
        <p>{{ report.description }}</p>

        <dl class="facts">
          <div v-if="location">
            <dt>Lokasi</dt>
            <dd>
              {{ location }}
              <a :href="mapUrl" target="_blank" rel="noopener">Buka di peta</a>
            </dd>
          </div>
          <div>
            <dt>Pelapor</dt>
            <dd>{{ formatReporter(report) }}</dd>
          </div>
          <div>
            <dt>Dilaporkan</dt>
            <dd>{{ formatDate(report.createdAt) }}</dd>
          </div>
          <div v-if="report.agency">
            <dt>Instansi</dt>
            <dd>{{ report.agency.name }}</dd>
          </div>
          <div v-if="report.reopenCount">
            <dt>Dibuka kembali</dt>
            <dd>{{ report.reopenCount }} kali</dd>
          </div>
        </dl>

        <template v-if="report.photos?.length">
          <h3>Foto laporan (sebelum)</h3>
          <ul class="photos">
            <li v-for="photo in report.photos" :key="photo.id">
              <a :href="assetUrl(photo.url)" target="_blank" rel="noopener">
                <img :src="assetUrl(photo.url)" :alt="`Foto laporan ${report.trackingCode}`" loading="lazy" />
              </a>
            </li>
          </ul>
        </template>
      </BaseCard>

      <BaseCard v-if="canUpdate" class="block">
        <h2>Perbarui progres</h2>
        <ProgressUpdateForm :report="report" @updated="handleUpdated" />
      </BaseCard>
      <p v-else-if="isOtherAgency" class="notice">
        Laporan ini ditangani {{ report.agency?.name ?? 'instansi lain' }}. Anda hanya bisa melihatnya.
      </p>
      <p v-else-if="isFinished" class="notice">Laporan ini sudah selesai, tidak ada tindakan lanjutan.</p>

      <BaseCard class="block">
        <h2>Riwayat progres</h2>
        <ProgressTimeline :items="report.timeline ?? []" />
      </BaseCard>
    </template>
  </section>
</template>

<style scoped>
.page { padding-block: 1.5rem; }
.page__back { display: inline-block; margin-bottom: 1rem; }
.page__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.page__header h1 { margin: 0; }
.page__error { color: var(--color-danger, #b91c1c); }
.block { margin-bottom: 1.5rem; }
.block h2 { margin-top: 0; }
.muted { color: var(--color-text-muted); }
.notice {
  margin: 0 0 1.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  color: var(--color-text-muted);
}

.facts {
  display: grid;
  gap: 0.5rem;
  margin: 1rem 0;
}
.facts div { display: grid; gap: 0.125rem; }
.facts dt { font-size: 0.875rem; color: var(--color-text-muted); }
.facts dd { margin: 0; }

.photos {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.photos img {
  display: block;
  width: 160px;
  height: 120px;
  object-fit: cover;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}
</style>