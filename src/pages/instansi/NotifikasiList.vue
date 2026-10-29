<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { notifikasiApi } from '@/api/notifikasi.api'
import { usePagination } from '@/composables/usePagination'
import { useNotifikasiStore } from '@/stores/notifikasi.store'
import { formatDateTime } from '@/utils/formatDate'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseEmptyState from '@/components/common/BaseEmptyState.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import BaseButton from '@/components/common/BaseButton.vue'

/**
 * NotifikasiList: daftar notifikasi milik user yang login (semua role memakai endpoint yang sama).
 * `reportRoute` = fungsi (report) => lokasi route, supaya tiap role membuka halaman laporannya sendiri.
 *   report = { id, trackingCode }
 */
const props = defineProps({
  reportRoute: { type: Function, required: true },
})

const router = useRouter()
const store = useNotifikasiStore()

// Jumlah belum dibaca ada di meta response, tapi usePagination tidak mengembalikan meta,
// jadi dicegat di sini dan disimpan ke store (dipakai juga oleh badge di navbar).
const fetchPage = async (params) => {
  const response = await notifikasiApi.list(params)
  const unread = response.data?.meta?.unreadCount
  if (unread !== undefined) store.setUnreadCount(unread)
  return response
}

const { items, loading, loadingMore, error, hasMore, load, loadMore } = usePagination(fetchPage, {
  limit: 15,
})

const unreadOnly = ref(false)
const actionError = ref('')

onMounted(() => load({}))
watch(unreadOnly, (value) => load({ unread: value || undefined }))

async function markRead(item) {
  actionError.value = ''
  try {
    await notifikasiApi.markRead(item.id)
    item.isRead = true
    store.decrement()
  } catch (e) {
    actionError.value = e.normalized?.message ?? 'Gagal menandai notifikasi.'
  }
}

async function open(item) {
  if (!item.isRead) await markRead(item)
  if (item.report) router.push(props.reportRoute(item.report))
}

async function markAllRead() {
  actionError.value = ''
  try {
    await notifikasiApi.markAllRead()
    items.value.forEach((item) => {
      item.isRead = true
    })
    store.setUnreadCount(0)
  } catch (e) {
    actionError.value = e.normalized?.message ?? 'Gagal menandai semua notifikasi.'
  }
}
</script>

<template>
  <div class="notif">
    <div class="notif__toolbar">
      <label class="notif__check">
        <input v-model="unreadOnly" type="checkbox" />
        Hanya yang belum dibaca
      </label>
      <BaseButton v-if="store.unreadCount > 0" variant="secondary" @click="markAllRead">
        Tandai semua sudah dibaca
      </BaseButton>
    </div>

    <p v-if="actionError" class="notif__error" role="alert">{{ actionError }}</p>
    <p v-if="error" class="notif__error" role="alert">{{ error }}</p>

    <BaseLoading v-if="loading" text="Memuat notifikasi..." />

    <BaseEmptyState
      v-else-if="!items.length && !error"
      :title="unreadOnly ? 'Tidak ada notifikasi yang belum dibaca' : 'Belum ada notifikasi'"
      description="Pembaruan pada laporan yang Anda ikuti akan muncul di sini."
    />

    <ul v-else class="notif__list">
      <li v-for="item in items" :key="item.id">
        <button
          type="button"
          class="notif__item"
          :class="{ 'notif__item--unread': !item.isRead }"
          @click="open(item)"
        >
          <span class="notif__head">
            <strong>{{ item.title }}</strong>
            <BaseBadge v-if="!item.isRead" variant="primary">Baru</BaseBadge>
          </span>
          <span class="notif__message">{{ item.message }}</span>
          <span class="notif__meta">
            <template v-if="item.report">{{ item.report.trackingCode }}, </template>{{ formatDateTime(item.createdAt) }}
          </span>
        </button>
      </li>
    </ul>

    <BasePagination :has-more="hasMore" :loading="loadingMore" @load-more="loadMore" />
  </div>
</template>

<style scoped>
.notif { display: grid; gap: 1rem; }
.notif__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.notif__check { display: flex; align-items: center; gap: 0.5rem; }
.notif__error { margin: 0; color: var(--color-danger, #b91c1c); }
.notif__list {
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.notif__item {
  display: grid;
  gap: 0.25rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.notif__item--unread { border-left: 4px solid var(--color-primary); }
.notif__item:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.notif__head { display: flex; align-items: center; gap: 0.5rem; }
.notif__meta { font-size: 0.875rem; color: var(--color-text-muted); }
</style>