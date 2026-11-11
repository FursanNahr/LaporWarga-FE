<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { AlarmClock, ArrowRight, Bell, CheckCheck, ClipboardList, Flag, MessageCircle } from 'lucide-vue-next'
import { notifikasiApi } from '@/api/notifikasi.api'
import { usePagination } from '@/composables/usePagination'
import { useToast } from '@/composables/useToast'
import { useNotifikasiStore } from '@/stores/notifikasi.store'
import { formatDate, formatDateTime, timeAgo } from '@/utils/formatDate'
import BaseEmptyState from '@/components/common/BaseEmptyState.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import BasePagination from '@/components/common/BasePagination.vue'

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
const toast = useToast()

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

onMounted(() => load({}))
watch(unreadOnly, (value) => load({ unread: value || undefined }))

async function markRead(item) {
  try {
    await notifikasiApi.markRead(item.id)
    item.isRead = true
    store.decrement()
  } catch (e) {
    toast.error(e.normalized?.message ?? 'Gagal menandai notifikasi.')
  }
}

async function open(item) {
  if (!item.isRead) await markRead(item)
  if (item.report) router.push(props.reportRoute(item.report))
}

async function markAllRead() {
  try {
    await notifikasiApi.markAllRead()
    items.value.forEach((item) => {
      item.isRead = true
    })
    store.setUnreadCount(0)
    toast.success('Semua notifikasi ditandai sudah dibaca.')
  } catch (e) {
    toast.error(e.normalized?.message ?? 'Gagal menandai semua notifikasi.')
  }
}

// ---- Tampilan ----
const TYPE_ICON = {
  STATUS_UPDATE: ClipboardList,
  KOMENTAR: MessageCircle,
  SANGGAHAN: Flag,
  SLA_TERLEWAT: AlarmClock,
}
const iconOf = (item) => TYPE_ICON[item.type] ?? Bell

const iconTone = (item) => {
  if (item.type === 'SLA_TERLEWAT') return item.isRead ? 'bg-red-100 text-red-700' : 'bg-red-600 text-white'
  return item.isRead ? 'bg-white text-maroon/60' : 'bg-lime text-maroon-dark'
}

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
const dayLabel = (value) => {
  const diff = Math.round((startOfDay(new Date()) - startOfDay(new Date(value))) / 86400000)
  if (diff <= 0) return 'Hari ini'
  if (diff === 1) return 'Kemarin'
  return formatDate(value)
}

// Kelompok per hari; urutan mengikuti data dari server (terbaru dulu).
const groups = computed(() => {
  const map = new Map()
  for (const item of items.value) {
    const label = dayLabel(item.createdAt)
    if (!map.has(label)) map.set(label, [])
    map.get(label).push(item)
  }
  return [...map].map(([label, list]) => ({ label, list }))
})

const pill = (active) =>
  active ? 'bg-maroon text-white' : 'bg-sand text-maroon hover:bg-sand-dark/60'
</script>

<template>
  <div class="space-y-6">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div role="group" aria-label="Filter notifikasi" class="flex flex-wrap gap-2">
        <button
          type="button"
          class="h-11 cursor-pointer rounded-full px-5 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
          :class="pill(!unreadOnly)"
          :aria-pressed="!unreadOnly"
          @click="unreadOnly = false"
        >
          Semua
        </button>
        <button
          type="button"
          class="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full px-5 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
          :class="pill(unreadOnly)"
          :aria-pressed="unreadOnly"
          @click="unreadOnly = true"
        >
          Belum dibaca
          <span
            v-if="store.unreadCount > 0"
            class="rounded-full px-2 py-0.5 text-xs font-extrabold"
            :class="unreadOnly ? 'bg-lime text-maroon-dark' : 'bg-maroon text-white'"
          >{{ store.unreadCount }}</span>
        </button>
      </div>

      <button
        v-if="store.unreadCount > 0"
        type="button"
        class="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border-2 border-maroon px-5 text-sm font-bold text-maroon transition-colors hover:bg-maroon hover:text-white"
        @click="markAllRead"
      >
        <CheckCheck class="size-4" aria-hidden="true" /> Tandai semua sudah dibaca
      </button>
    </div>

    <p
      v-if="error"
      class="rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-sm font-semibold text-red-800"
      role="alert"
    >
      {{ error }}
    </p>

    <BaseLoading v-if="loading" text="Memuat notifikasi..." />

    <BaseEmptyState
      v-else-if="!items.length && !error"
      :title="unreadOnly ? 'Tidak ada notifikasi yang belum dibaca' : 'Belum ada notifikasi'"
      description="Pembaruan pada laporan yang Anda ikuti akan muncul di sini."
    />

    <!-- Daftar per hari -->
    <div v-else class="space-y-7">
      <section v-for="group in groups" :key="group.label" :aria-label="group.label">
        <h2 class="mb-3 pl-1 text-xs font-bold uppercase tracking-widest text-maroon/70">{{ group.label }}</h2>
        <ul class="space-y-3">
          <li v-for="item in group.list" :key="item.id">
            <button
              type="button"
              class="group flex w-full cursor-pointer items-start gap-4 rounded-2xl border p-4 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
              :class="item.isRead ? 'border-sand-dark bg-sand' : 'border-lime-dark/50 bg-lime/20'"
              @click="open(item)"
            >
              <span class="flex size-11 shrink-0 items-center justify-center rounded-full" :class="iconTone(item)" aria-hidden="true">
                <component :is="iconOf(item)" class="size-5" />
              </span>

              <span class="min-w-0 flex-1">
                <span class="flex items-center gap-2">
                  <strong class="break-words leading-tight text-maroon" :class="item.isRead ? 'font-bold' : 'font-extrabold'">{{ item.title }}</strong>
                  <span v-if="!item.isRead" class="size-2.5 shrink-0 rounded-full bg-maroon" aria-hidden="true"></span>
                  <span v-if="!item.isRead" class="sr-only">Belum dibaca</span>
                </span>
                <span class="mt-1 block text-sm leading-relaxed" :class="item.isRead ? 'text-maroon/70' : 'text-maroon/90'">{{ item.message }}</span>
                <span class="mt-2.5 flex flex-wrap items-center gap-2 text-xs font-semibold text-maroon/70">
                  <span v-if="item.report" class="rounded-lg bg-white px-2.5 py-1 font-extrabold tracking-wide text-maroon">{{ item.report.trackingCode }}</span>
                  <time :datetime="item.createdAt" :title="formatDateTime(item.createdAt)">{{ timeAgo(item.createdAt) }}</time>
                </span>
              </span>

              <ArrowRight
                v-if="item.report"
                class="mt-3 size-5 shrink-0 text-maroon/40 transition-transform group-hover:translate-x-1 group-hover:text-maroon"
                aria-hidden="true"
              />
            </button>
          </li>
        </ul>
      </section>
    </div>

    <BasePagination :has-more="hasMore" :loading="loadingMore" @load-more="loadMore" />
  </div>
</template>