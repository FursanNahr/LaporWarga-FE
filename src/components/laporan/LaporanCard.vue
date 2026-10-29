<script setup>
import { computed } from 'vue'
import { assetUrl } from '@/api'
import { REPORT_STATUS } from '@/constants/status'
import { formatDate } from '@/utils/formatDate'
import { formatDistance, formatReporter } from '@/utils/formatStatus'
import BaseCard from '@/components/common/BaseCard.vue'
import StatusBadge from '@/components/laporan/StatusBadge.vue'

/**
 * LaporanCard: ringkasan satu laporan (dipakai di Cari Laporan dan Laporan Saya).
 * `report` = satu item dari GET /reports atau GET /reports/me.
 * Seluruh kartu bisa diklik menuju halaman detail.
 */
  const props = defineProps({
    report: { type: Object, required: true },
  })

  const photo = computed(() => assetUrl(props.report.photos?.[0]?.url))
  const photoCount = computed(() => props.report.photos?.length ?? 0)

  const category = computed(() => {
    const sub = props.report.subcategory
    if (!sub) return ''
    return sub.category?.name ? `${sub.category.name} › ${sub.name}` : sub.name
  })

  const location = computed(() =>
    [props.report.address, props.report.district?.name].filter(Boolean).join(', '),
  )

  const showRejection = computed(
    () => props.report.status === REPORT_STATUS.DITOLAK && props.report.rejectionReason,
  )
  </script>

  <template>
    <BaseCard tag="article">
      <div class="card__media">
        <img v-if="photo" :src="photo" :alt="`Foto laporan ${report.trackingCode}`" loading="lazy" />
        <div v-else class="card__placeholder">Tanpa foto</div>
        <span v-if="photoCount > 1" class="card__count">{{ photoCount }} foto</span>
      </div>

      <div class="card__body">
        <div class="card__top">
          <RouterLink
            :to="{ name: 'detail-laporan', params: { id: report.id } }"
            class="card__link"
          >
            {{ report.trackingCode }}
          </RouterLink>
          <StatusBadge :status="report.status" />
        </div>

        <p v-if="category" class="card__category">{{ category }}</p>
        <p class="card__description">{{ report.description }}</p>

        <p v-if="showRejection" class="card__rejection">Alasan penolakan: {{ report.rejectionReason }}</p>

        <p v-if="location" class="card__meta">{{ location }}</p>
        <p v-if="report.agency" class="card__meta">Ditangani: {{ report.agency.name }}</p>

        <p class="card__meta">
          {{ formatReporter(report) }} · {{ formatDate(report.createdAt) }}
          <template v-if="report.distanceMeters !== null && report.distanceMeters !== undefined">
            · {{ formatDistance(report.distanceMeters) }} dari lokasimu
          </template>
        </p>

        <p class="card__stats">
          {{ report.stats.upvotes }} dukungan · {{ report.stats.verifications }} verifikasi ·
          {{ report.stats.comments }} komentar
        </p>
      </div>
    </BaseCard>
  </template>

<style scoped>
.card__media {
  position: relative;
  aspect-ratio: 4 / 3;
  background: var(--color-bg-soft);
}
.card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.card__placeholder {
  display: grid;
  place-items: center;
  height: 100%;
  color: var(--color-text-muted);
}
.card__count {
  position: absolute;
  right: 0.5rem;
  bottom: 0.5rem;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-size: 0.75rem;
}

.card__body { padding: 1rem; }
.card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

/* Link "stretched": area klik meliputi seluruh kartu */
.card__link {
  font-weight: 700;
  color: var(--color-primary);
}
.card__link::after {
  content: '';
  position: absolute;
  inset: 0;
}
.card__link:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }

.card__category {
  margin: 0 0 0.25rem;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}
.card__description {
  margin: 0 0 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card__rejection {
  margin: 0 0 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius);
  background: #fee2e2;
  color: #991b1b;
  font-size: 0.875rem;
}
.card__meta {
  margin: 0 0 0.25rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
.card__stats {
  margin: 0.5rem 0 0;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border);
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}
</style>