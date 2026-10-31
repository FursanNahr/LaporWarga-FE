<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { assetUrl } from '@/api'
import { supportApi } from '@/api/support.api'
import { useAuth } from '@/composables/useAuth'
import { ROLES } from '@/constants/roles'
import { REPORT_STATUS } from '@/constants/status'
import { formatDate } from '@/utils/formatDate'
import { formatDistance, formatReporter } from '@/utils/formatStatus'
import StatusBadge from '@/components/laporan/StatusBadge.vue'

/**
 * FeedCard: satu laporan di feed (gaya Instagram). Dipakai di FeedPage.
 * `report` = satu item dari GET /reports.
 *
 * Tombol Dukung / Verifikasi diperbarui langsung di layar (optimistic), lalu disamakan dengan
 * jawaban server. Kalau gagal, angkanya dikembalikan dan muncul pesan singkat.
 */
const props = defineProps({
  report: { type: Object, required: true },
})

const route = useRoute()
const router = useRouter()
const { isLoggedIn, role } = useAuth()

// ---- Data tampilan ---------------------------------------------------------

const photos = computed(() =>
  (props.report.photos ?? []).map((photo) => ({ id: photo.id, src: assetUrl(photo.url) })),
)

const reporterName = computed(() => formatReporter(props.report))
const avatar = computed(() => assetUrl(props.report.reporter?.avatarUrl))
const initial = computed(() => reporterName.value?.trim()?.[0]?.toUpperCase() ?? '?')

const category = computed(() => {
  const sub = props.report.subcategory
  if (!sub) return ''
  return sub.category?.name ? `${sub.category.name} › ${sub.name}` : sub.name
})

const location = computed(() =>
  [props.report.address, props.report.district?.name].filter(Boolean).join(', '),
)

const hasDistance = computed(
  () => props.report.distanceMeters !== null && props.report.distanceMeters !== undefined,
)

const showRejection = computed(
  () => props.report.status === REPORT_STATUS.DITOLAK && props.report.rejectionReason,
)

// Deskripsi panjang dipotong 3 baris, bisa dibuka.
const expanded = ref(false)
const isLong = computed(() => (props.report.description?.length ?? 0) > 140)

// Penanda foto yang sedang terlihat saat digeser.
const activeSlide = ref(0)
function onSlide(event) {
  const el = event.target
  if (el.clientWidth > 0) activeSlide.value = Math.round(el.scrollLeft / el.clientWidth)
}

// ---- Dukung & verifikasi ---------------------------------------------------

const counts = reactive({ upvote: 0, verify: 0 })
const mine = reactive({ upvote: false, verify: false })
const busy = reactive({ upvote: false, verify: false })

function syncFromProps() {
  counts.upvote = props.report.stats?.upvotes ?? 0
  counts.verify = props.report.stats?.verifications ?? 0
  mine.upvote = props.report.viewer?.hasUpvoted ?? false
  mine.verify = props.report.viewer?.hasVerified ?? false
}
syncFromProps()
watch(() => props.report, syncFromProps)

// Alasan tombol tidak bisa dipakai. Tamu sengaja tidak dihitung: tombolnya aktif dan
// menekannya mengarahkan ke halaman Masuk.
const blockedReason = computed(() => {
  if (!isLoggedIn.value) return ''
  if (role.value !== ROLES.WARGA) return 'Hanya akun warga yang dapat memberi dukungan'
  if (props.report.viewer?.isOwner) return 'Kamu tidak bisa mendukung laporanmu sendiri'
  return ''
})

// Pesan singkat di dalam kartu (menggantikan toast, hilang sendiri).
const notice = ref('')
let noticeTimer = null
function showNotice(message) {
  notice.value = message
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => (notice.value = ''), 3500)
}
onBeforeUnmount(() => clearTimeout(noticeTimer))

function goToLogin() {
  router.push({ name: 'masuk', query: { redirect: route.fullPath } })
}

async function toggle(kind) {
  if (!isLoggedIn.value) return goToLogin()
  if (blockedReason.value) return showNotice(blockedReason.value)
  if (busy[kind]) return

  const next = !mine[kind]
  const delta = next ? 1 : -1

  // Tampilkan hasilnya dulu...
  mine[kind] = next
  counts[kind] = Math.max(0, counts[kind] + delta)
  busy[kind] = true

  try {
    const { data: body } = next
      ? await supportApi.add(props.report.id, kind)
      : await supportApi.remove(props.report.id, kind)

    // ...lalu samakan dengan angka dari server (bisa berbeda kalau warga lain ikut mendukung).
    const state = body.data
    counts[kind] = kind === 'upvote' ? state.stats.upvotes : state.stats.verifications
    mine[kind] = kind === 'upvote' ? state.viewer.hasUpvoted : state.viewer.hasVerified
  } catch (e) {
    // Gagal: kembalikan seperti semula.
    mine[kind] = !next
    counts[kind] = Math.max(0, counts[kind] - delta)
    showNotice(e.normalized?.message ?? 'Gagal menyimpan dukungan')
  } finally {
    busy[kind] = false
  }
}
</script>

<template>
  <article class="feed-card">
    <header class="feed-card__head">
      <span class="feed-card__avatar" aria-hidden="true">
        <img v-if="avatar" :src="avatar" alt="" loading="lazy" />
        <template v-else>{{ initial }}</template>
      </span>

      <div class="feed-card__who">
        <strong class="feed-card__name">{{ reporterName }}</strong>
        <span class="feed-card__time">
          {{ formatDate(report.createdAt) }}
          <template v-if="hasDistance"> · {{ formatDistance(report.distanceMeters) }} dari lokasimu</template>
        </span>
      </div>

      <StatusBadge :status="report.status" />
    </header>

    <div class="feed-card__media">
      <div v-if="photos.length" class="feed-card__slides" @scroll.passive="onSlide">
        <img
          v-for="photo in photos"
          :key="photo.id"
          class="feed-card__slide"
          :src="photo.src"
          :alt="`Foto laporan ${report.trackingCode}`"
          loading="lazy"
        />
      </div>
      <div v-else class="feed-card__placeholder">Tanpa foto</div>
      <span v-if="photos.length > 1" class="feed-card__count">{{ activeSlide + 1 }}/{{ photos.length }}</span>
    </div>

    <div class="feed-card__actions">
      <button
        type="button"
        class="feed-card__action"
        :class="{ 'is-on': mine.upvote }"
        :aria-pressed="mine.upvote"
        :aria-disabled="Boolean(blockedReason)"
        :title="blockedReason || 'Dukung agar laporan ini diprioritaskan'"
        @click="toggle('upvote')"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
        {{ mine.upvote ? 'Didukung' : 'Dukung' }} · {{ counts.upvote }}
      </button>

      <button
        type="button"
        class="feed-card__action"
        :class="{ 'is-on': mine.verify }"
        :aria-pressed="mine.verify"
        :aria-disabled="Boolean(blockedReason)"
        :title="blockedReason || 'Konfirmasi bahwa masalah ini benar ada'"
        @click="toggle('verify')"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        {{ mine.verify ? 'Terverifikasi' : 'Verifikasi' }} · {{ counts.verify }}
      </button>

      <RouterLink
        :to="{ name: 'detail-laporan', params: { id: report.id } }"
        class="feed-card__action"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        Komentar · {{ report.stats?.comments ?? 0 }}
      </RouterLink>
    </div>

    <p v-if="notice" class="feed-card__notice" role="status">{{ notice }}</p>

    <div class="feed-card__body">
      <p v-if="category" class="feed-card__category">{{ category }}</p>

      <p class="feed-card__description" :class="{ 'is-clamped': isLong && !expanded }">
        {{ report.description }}
      </p>
      <button v-if="isLong" type="button" class="feed-card__more" @click="expanded = !expanded">
        {{ expanded ? 'Sembunyikan' : 'Selengkapnya' }}
      </button>

      <p v-if="showRejection" class="feed-card__rejection">Alasan penolakan: {{ report.rejectionReason }}</p>

      <p v-if="location" class="feed-card__meta">{{ location }}</p>
      <p v-if="report.agency" class="feed-card__meta">Ditangani: {{ report.agency.name }}</p>

      <p class="feed-card__meta">
        <RouterLink
          :to="{ name: 'detail-laporan', params: { id: report.id } }"
          class="feed-card__link"
        >
          {{ report.trackingCode }} · Lihat detail dan progres
        </RouterLink>
      </p>
    </div>
  </article>
</template>

<style scoped>
/* Warna memakai variabel dengan nilai cadangan; sesuaikan namanya dengan variables.css-mu. */
.feed-card {
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 12px;
  overflow: hidden;
}

.feed-card__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
}
.feed-card__avatar {
  width: 36px;
  height: 36px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 50%;
  overflow: hidden;
  font-weight: 600;
  background: var(--color-primary-soft, #e0e7ff);
  color: var(--color-primary, #2563eb);
}
.feed-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.feed-card__who {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.feed-card__name {
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.feed-card__time {
  font-size: 0.78rem;
  color: var(--color-text-muted, #6b7280);
}

.feed-card__media {
  position: relative;
  background: var(--color-bg-muted, #f3f4f6);
}
.feed-card__slides {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}
.feed-card__slides::-webkit-scrollbar {
  display: none;
}
.feed-card__slide {
  flex: 0 0 100%;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  display: block;
  scroll-snap-align: center;
}
.feed-card__placeholder {
  aspect-ratio: 4 / 3;
  display: grid;
  place-items: center;
  color: var(--color-text-muted, #6b7280);
}
.feed-card__count {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  color: #fff;
  background: rgb(0 0 0 / 55%);
}

.feed-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 12px 4px;
}
.feed-card__action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 999px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.85rem;
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
}
.feed-card__action:hover {
  background: var(--color-bg-muted, #f3f4f6);
}
.feed-card__action.is-on {
  border-color: var(--color-primary, #2563eb);
  background: var(--color-primary-soft, #e0e7ff);
  color: var(--color-primary, #2563eb);
}
.feed-card__action[aria-disabled='true'] {
  opacity: 0.55;
  cursor: not-allowed;
}

.feed-card__notice {
  margin: 4px 14px 0;
  font-size: 0.82rem;
  color: var(--color-danger, #b91c1c);
}

.feed-card__body {
  padding: 8px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.feed-card__body p {
  margin: 0;
}
.feed-card__category {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--color-primary, #2563eb);
}
.feed-card__description {
  white-space: pre-line;
  overflow-wrap: anywhere;
}
.feed-card__description.is-clamped {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.feed-card__more {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-size: 0.85rem;
  color: var(--color-text-muted, #6b7280);
  cursor: pointer;
}
.feed-card__rejection {
  font-size: 0.85rem;
  color: var(--color-danger, #b91c1c);
}
.feed-card__meta {
  font-size: 0.82rem;
  color: var(--color-text-muted, #6b7280);
}
.feed-card__link {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
