<script setup>
import { assetUrl } from '@/api'
import { formatDateTime } from '@/utils/formatDate'
import { formatDistance, humanizeEnum } from '@/utils/formatStatus'
import StatusBadge from '@/components/laporan/StatusBadge.vue'

/**
 * ProgressTimeline: riwayat progres laporan (urut dari yang paling lama).
 * `items` = report.timeline dari GET /reports/:id, tiap item:
 *   { id, fromStatus, toStatus, note, createdAt, actor: { name, role }, attachments: [...] }
 */
defineProps({
  items: { type: Array, default: () => [] },
})

const isImage = (attachment) => /\.(jpe?g|png|webp|gif)$/i.test(attachment.url || attachment.fileName || '')
</script>

<template>
  <ol v-if="items.length" class="timeline">
    <li v-for="item in items" :key="item.id" class="timeline__item">
      <span class="timeline__dot" aria-hidden="true"></span>

      <div class="timeline__content">
        <div class="timeline__status">
          <template v-if="item.fromStatus">
            <StatusBadge :status="item.fromStatus" />
            <span aria-label="menjadi">→</span>
          </template>
          <StatusBadge :status="item.toStatus" />
        </div>

        <p v-if="item.note" class="timeline__note">{{ item.note }}</p>

        <p class="timeline__meta">
          {{ item.actor.name }} ({{ humanizeEnum(item.actor.role) }}) · {{ formatDateTime(item.createdAt) }}
        </p>

        <ul v-if="item.attachments?.length" class="timeline__attachments">
          <li v-for="attachment in item.attachments" :key="attachment.id">
            <a :href="assetUrl(attachment.url)" target="_blank" rel="noopener">
              <img
                v-if="isImage(attachment)"
                :src="assetUrl(attachment.url)"
                :alt="`Lampiran ${humanizeEnum(attachment.kind)}`"
                loading="lazy"
              />
              <span v-else>{{ attachment.fileName || 'Buka lampiran' }}</span>
            </a>
            <span class="timeline__caption">
              {{ humanizeEnum(attachment.kind) }}
              <template v-if="attachment.capturedAt"> · {{ formatDateTime(attachment.capturedAt) }}</template>
              <template v-if="attachment.distanceFromReportM !== null && attachment.distanceFromReportM !== undefined">
                · {{ formatDistance(attachment.distanceFromReportM) }} dari lokasi laporan
              </template>
            </span>
          </li>
        </ul>
      </div>
    </li>
  </ol>
  <p v-else class="timeline__empty">Belum ada riwayat progres.</p>
</template>

<style scoped>
.timeline {
  position: relative;
  margin: 0;
  padding: 0 0 0 1.5rem;
  list-style: none;
}
.timeline::before {
  content: '';
  position: absolute;
  top: 0.5rem;
  bottom: 0.5rem;
  left: 0.4375rem;
  width: 2px;
  background: var(--color-border);
}
.timeline__item {
  position: relative;
  padding-bottom: 1.5rem;
}
.timeline__item:last-child { padding-bottom: 0; }
.timeline__dot {
  position: absolute;
  top: 0.375rem;
  left: -1.5rem;
  width: 0.9375rem;
  height: 0.9375rem;
  border-radius: 50%;
  background: var(--color-primary);
  border: 3px solid var(--color-bg);
  box-shadow: 0 0 0 1px var(--color-primary);
}
.timeline__status {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.timeline__note { margin: 0.5rem 0 0; }
.timeline__meta {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
.timeline__attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 0.75rem 0 0;
  padding: 0;
  list-style: none;
}
.timeline__attachments img {
  display: block;
  width: 120px;
  height: 90px;
  object-fit: cover;
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
}
.timeline__caption {
  display: block;
  max-width: 160px;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
.timeline__empty { color: var(--color-text-muted); }
</style>