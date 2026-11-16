<script setup>
import { ref, watch } from 'vue'
import { CircleCheck, Clock, RotateCcw, TriangleAlert } from 'lucide-vue-next'
import { assetUrl } from '@/api'
import { confirmationApi } from '@/api/confirmation.api'
import { formatDateTime } from '@/utils/formatDate'

/**
 * ConfirmationHistory: riwayat konfirmasi pelapor, sanggahan (beserta foto bukti), dan keputusan admin.
 * Data dari GET /reports/:id/confirmations (publik, mengikuti aturan anonim di BE).
 * Tidak menampilkan apa pun jika belum ada konfirmasi atau data gagal dimuat.
 *
 * `reloadKey` = nilai apa saja yang berubah saat laporan dimuat ulang (mis. report.updatedAt),
 * supaya riwayat ikut dimuat ulang tanpa menyentuh state halaman.
 */
const props = defineProps({
  reportId: { type: Number, required: true },
  reloadKey: { type: [String, Number], default: '' },
})

const rows = ref([])

let requestId = 0 // respons milik request lama dibuang
async function load() {
  const id = ++requestId
  try {
    const { data: body } = await confirmationApi.list(props.reportId)
    if (id !== requestId) return
    rows.value = body.data ?? []
  } catch {
    if (id !== requestId) return
    rows.value = []
  }
}

watch(() => [props.reportId, props.reloadKey], load, { immediate: true })

const RESULT_META = {
  SUDAH_BERES: { title: 'Pelapor mengonfirmasi sudah beres', tone: 'bg-emerald-100 text-emerald-900', icon: CircleCheck },
  BELUM_BERES: { title: 'Pelapor menyanggah hasil', tone: 'bg-red-100 text-red-800', icon: TriangleAlert },
  AUTO_CONFIRMED: { title: 'Ditutup otomatis oleh sistem', tone: 'bg-sand text-maroon', icon: Clock },
}
const DECISION_META = {
  REOPEN: { title: 'Admin membuka kembali laporan', icon: RotateCcw },
  CLOSE: { title: 'Admin menutup laporan', icon: CircleCheck },
}
const metaOf = (row) => RESULT_META[row.result] ?? RESULT_META.AUTO_CONFIRMED
</script>

<template>
  <section
    v-if="rows.length"
    class="rounded-3xl border border-sand-dark/70 bg-white/70 p-5 sm:p-6"
    aria-labelledby="riwayat-konfirmasi"
  >
    <h2 id="riwayat-konfirmasi" class="flex items-center gap-3 text-lg font-extrabold">
      <CircleCheck class="size-6" aria-hidden="true" /> Konfirmasi &amp; Sanggahan
    </h2>

    <ul class="mt-4 grid gap-4">
      <li v-for="row in rows" :key="row.id" class="rounded-2xl border border-sand-dark/70 bg-white p-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold" :class="metaOf(row).tone">
            <component :is="metaOf(row).icon" class="size-3.5" aria-hidden="true" />
            {{ metaOf(row).title }}
          </span>
          <time class="text-xs text-maroon/70" :datetime="row.createdAt">{{ formatDateTime(row.createdAt) }}</time>
        </div>

        <p class="mt-2 text-xs text-maroon/60">{{ row.isAutomatic ? 'Sistem' : (row.author?.name ?? 'Pelapor') }}</p>
        <p v-if="row.note" class="mt-1 whitespace-pre-line break-words text-sm leading-relaxed">{{ row.note }}</p>

        <ul v-if="row.photos?.length" class="mt-3 flex flex-wrap gap-3">
          <li v-for="(url, index) in row.photos" :key="url">
            <a
              :href="assetUrl(url)"
              target="_blank"
              rel="noopener"
              class="block overflow-hidden rounded-xl border border-sand-dark hover:border-maroon"
            >
              <img
                :src="assetUrl(url)"
                :alt="`Foto bukti sanggahan ${index + 1}`"
                loading="lazy"
                class="block h-[84px] w-28 object-cover"
              />
            </a>
          </li>
        </ul>

        <!-- Keputusan admin atas sanggahan ini -->
        <div v-if="row.adminDecision" class="mt-3 rounded-xl bg-sand/70 p-3">
          <p class="flex items-center gap-2 text-sm font-extrabold">
            <component :is="DECISION_META[row.adminDecision.decision]?.icon ?? CircleCheck" class="size-4" aria-hidden="true" />
            {{ DECISION_META[row.adminDecision.decision]?.title ?? 'Keputusan admin' }}
          </p>
          <p v-if="row.adminDecision.note" class="mt-1 whitespace-pre-line break-words text-sm">{{ row.adminDecision.note }}</p>
          <p class="mt-1 text-xs text-maroon/60">
            <template v-if="row.adminDecision.decidedBy">{{ row.adminDecision.decidedBy }}, </template>
            <time v-if="row.adminDecision.decidedAt" :datetime="row.adminDecision.decidedAt">{{ formatDateTime(row.adminDecision.decidedAt) }}</time>
          </p>
        </div>
        <p
          v-else-if="row.result === 'BELUM_BERES'"
          class="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900"
        >
          Menunggu keputusan admin.
        </p>
      </li>
    </ul>
  </section>
</template>
