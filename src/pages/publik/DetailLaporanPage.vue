<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { assetUrl } from '@/api'
import { laporanApi } from '@/api/laporan.api'
import { REPORT_STATUS } from '@/constants/status'
import { formatDate } from '@/utils/formatDate'
import { formatReporter } from '@/utils/formatStatus'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseEmptyState from '@/components/common/BaseEmptyState.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import ProgressTimeline from '@/components/laporan/ProgressTimeline.vue'
import StatusBadge from '@/components/laporan/StatusBadge.vue'

const route = useRoute()

const report = ref(null)
const loading = ref(true)
const error = ref('')
const notFound = ref(false)
const activePhoto = ref(0)

async function fetchReport(id) {
  loading.value = true
  error.value = ''
  notFound.value = false
  report.value = null
  activePhoto.value = 0

  try {
    const { data: body } = await laporanApi.detail(id)
    report.value = body.data
  } catch (e) {
    // BE membalas 404 juga untuk laporan yang belum boleh dilihat (menjaga kerahasiaan)
    if (e.normalized?.status === 404) notFound.value = true
    else error.value = e.normalized?.message ?? 'Gagal memuat laporan'
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, (id) => id && fetchReport(id), { immediate: true })

const photos = computed(() => report.value?.photos ?? [])
const mainPhoto = computed(() => assetUrl(photos.value[activePhoto.value]?.url))

const category = computed(() => {
  const sub = report.value?.subcategory
  if (!sub) return '-'
  return sub.category?.name ? `${sub.category.name} › ${sub.name}` : sub.name
})

const mapUrl = computed(() => {
  const { latitude, longitude } = report.value ?? {}
  if (latitude === undefined || longitude === undefined) return ''
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`
})
</script>

<template>
  <section class="container page">
    <RouterLink :to="{ name: 'cari-laporan' }" class="back">← Kembali ke Cari Laporan</RouterLink>

    <BaseLoading v-if="loading" />

    <BaseEmptyState
      v-else-if="notFound"
      title="Laporan tidak ditemukan"
      description="Laporan ini tidak ada atau belum bisa dilihat."
    >
      <RouterLink :to="{ name: 'cari-laporan' }" class="btn btn-primary">Cari laporan lain</RouterLink>
    </BaseEmptyState>

    <template v-else-if="error">
      <p class="form-alert" role="alert">{{ error }}</p>
      <BaseButton variant="secondary" @click="fetchReport(route.params.id)">Coba lagi</BaseButton>
    </template>

    <article v-else-if="report" class="detail">
      <header class="detail__head">
        <h1>{{ report.trackingCode }}</h1>
        <StatusBadge :status="report.status" />
        <BaseBadge v-if="report.viewer?.isOwner" variant="primary">Laporan Anda</BaseBadge>
      </header>

      <p
        v-if="report.status === REPORT_STATUS.DITOLAK && report.rejectionReason"
        class="form-alert"
        role="alert"
      >
        Laporan ditolak: {{ report.rejectionReason }}
      </p>
      <p v-if="report.reopenCount > 0" class="detail__note">
        Laporan ini sudah dibuka kembali {{ report.reopenCount }} kali.
      </p>

      <div v-if="photos.length" class="gallery">
        <img class="gallery__main" :src="mainPhoto" :alt="`Foto ${activePhoto + 1} laporan ${report.trackingCode}`" />
        <ul v-if="photos.length > 1" class="gallery__thumbs">
          <li v-for="(photo, index) in photos" :key="photo.id">
            <button
              type="button"
              :class="['gallery__thumb', { 'is-active': index === activePhoto }]"
              :aria-label="`Lihat foto ${index + 1}`"
              :aria-pressed="index === activePhoto"
              @click="activePhoto = index"
            >
              <img :src="assetUrl(photo.url)" alt="" loading="lazy" />
            </button>
          </li>
        </ul>
      </div>

      <h2>Deskripsi</h2>
      <p class="detail__description">{{ report.description }}</p>

      <h2>Informasi</h2>
      <dl class="info">
        <dt>Jenis</dt>
        <dd>{{ category }}</dd>
        <dt>Instansi</dt>
        <dd>{{ report.agency?.name ?? '-' }}</dd>
        <dt>Alamat</dt>
        <dd>{{ report.address || '-' }}</dd>
        <dt>Kecamatan</dt>
        <dd>{{ report.district?.name ?? '-' }}</dd>
        <dt>Koordinat</dt>
        <dd>
          {{ report.latitude }}, {{ report.longitude }}
          <a v-if="mapUrl" :href="mapUrl" target="_blank" rel="noopener">Lihat di peta</a>
        </dd>
        <dt>Pelapor</dt>
        <dd>{{ formatReporter(report) }}</dd>
        <dt>Dibuat</dt>
        <dd>{{ formatDate(report.createdAt) }}</dd>
        <dt>Dukungan</dt>
        <dd>
          {{ report.stats.upvotes }} dukungan · {{ report.stats.verifications }} verifikasi ·
          {{ report.stats.comments }} komentar
        </dd>
      </dl>

      <h2>Riwayat progres</h2>
      <ProgressTimeline :items="report.timeline ?? []" />
    </article>
  </section>
</template>

<style scoped>
.page { padding-top: 2rem; padding-bottom: 3rem; max-width: 820px; }
.back { display: inline-block; margin-bottom: 1rem; color: var(--color-primary); }

.detail__head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.detail__head h1 { margin: 0; }
.detail__note { color: var(--color-text-muted); }
.detail__description { white-space: pre-line; }

.gallery { margin: 1rem 0 1.5rem; }
.gallery__main {
  display: block;
  width: 100%;
  max-height: 420px;
  object-fit: contain;
  background: var(--color-bg-soft);
  border-radius: var(--radius);
}
.gallery__thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.75rem 0 0;
  padding: 0;
  list-style: none;
}
.gallery__thumb {
  padding: 0;
  border: 2px solid transparent;
  border-radius: var(--radius);
  background: none;
  cursor: pointer;
}
.gallery__thumb.is-active { border-color: var(--color-primary); }
.gallery__thumb img {
  display: block;
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: calc(var(--radius) - 2px);
}

.info {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 0.5rem 1rem;
  margin: 0 0 1.5rem;
}
.info dt { color: var(--color-text-muted); }
.info dd { margin: 0; }
.info a { margin-left: 0.5rem; color: var(--color-primary); }

@media (max-width: 480px) {
  .info { grid-template-columns: 1fr; gap: 0; }
  .info dd { margin-bottom: 0.75rem; }
}
</style>