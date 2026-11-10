<script setup>
import { ref, watch } from 'vue'
import { assetUrl } from '@/api'
import { adminApi } from '@/api/admin.api'
import { formatDate } from '@/utils/formatDate'
import { formatDistance } from '@/utils/formatStatus'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import StatusBadge from '@/components/laporan/StatusBadge.vue'

/**
 * DuplicatePanel: cari laporan sejenis di sekitar lokasi, lalu gabungkan.
 * Laporan yang sedang dibuka (`reportId`) = DUPLIKAT yang digabung ke laporan utama yang dipilih.
 * Memancarkan `merged` dengan detail laporan utama.
 */
const props = defineProps({
  reportId: { type: [Number, String], required: true },
})
const emit = defineEmits(['merged'])

const candidates = ref(null) // null = belum dicari
const searching = ref(false)
const searchError = ref('')

async function search() {
  searching.value = true
  searchError.value = ''
  try {
    const { data: body } = await adminApi.kandidatDuplikat(props.reportId)
    candidates.value = body.data
  } catch (e) {
    searchError.value = e.normalized?.message ?? 'Gagal mencari kandidat duplikat.'
  } finally {
    searching.value = false
  }
}

// Pindah ke laporan lain: hasil pencarian lama tidak berlaku lagi.
watch(() => props.reportId, () => (candidates.value = null))

// ---- Konfirmasi gabung ----
const open = ref(false)
const target = ref(null)
const note = ref('')
const merging = ref(false)
const mergeError = ref('')

function choose(candidate) {
  target.value = candidate
  note.value = ''
  mergeError.value = ''
  open.value = true
}

async function merge() {
  if (merging.value) return
  merging.value = true
  mergeError.value = ''
  try {
    const { data: body } = await adminApi.gabungLaporan(props.reportId, {
      targetId: target.value.id,
      note: note.value.trim() || undefined,
    })
    open.value = false
    emit('merged', body.data)
  } catch (e) {
    mergeError.value = e.normalized?.message ?? 'Gagal menggabungkan laporan.'
  } finally {
    merging.value = false
  }
}
</script>

<template>
  <div class="grid gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="max-w-prose text-sm text-maroon/70">
        Cari laporan sejenis dalam radius 200 m. Laporan ini akan digabung ke laporan utama yang kamu pilih.
      </p>
      <BaseButton variant="secondary" :loading="searching" @click="search">
        {{ searching ? 'Mencari...' : candidates ? 'Cari ulang' : 'Cari kandidat duplikat' }}
      </BaseButton>
    </div>

    <p v-if="searchError" class="rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-800" role="alert">{{ searchError }}</p>
    <p
      v-if="candidates && !candidates.length"
      class="rounded-2xl border border-dashed border-sand-dark bg-cream px-4 py-4 text-center text-sm text-maroon/70"
    >
      Tidak ada kandidat duplikat di sekitar lokasi ini.
    </p>

    <ul v-if="candidates?.length" class="grid gap-3">
      <li
        v-for="candidate in candidates"
        :key="candidate.id"
        class="flex flex-wrap items-center gap-4 rounded-2xl border border-sand-dark bg-cream p-3"
      >
        <img
          v-if="candidate.photos?.[0]"
          :src="assetUrl(candidate.photos[0].url)"
          :alt="`Foto ${candidate.trackingCode}`"
          loading="lazy"
          class="h-20 w-28 shrink-0 rounded-xl border border-sand-dark object-cover"
        />
        <div class="min-w-48 flex-1">
          <p class="flex flex-wrap items-center gap-2">
            <RouterLink
              :to="{ name: 'admin-detail-laporan', params: { id: candidate.id } }"
              class="font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900"
              target="_blank"
            >
              {{ candidate.trackingCode }}
            </RouterLink>
            <StatusBadge :status="candidate.status" />
          </p>
          <p class="mt-1 line-clamp-2 text-sm text-maroon">{{ candidate.description }}</p>
          <p class="mt-1 text-xs text-maroon/60">
            {{ formatDistance(candidate.distanceMeters) }} dari laporan ini, {{ formatDate(candidate.createdAt) }},
            {{ candidate.supportCount }} dukungan
          </p>
        </div>
        <button
          type="button"
          class="rounded-full border border-sand-dark bg-white px-4 py-1.5 text-sm font-semibold text-maroon hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
          @click="choose(candidate)"
        >
          Jadikan laporan utama
        </button>
      </li>
    </ul>

    <BaseModal v-model="open" title="Gabungkan laporan duplikat">
      <div class="grid gap-4 text-maroon">
        <p v-if="mergeError" class="rounded-2xl bg-red-100 px-4 py-3 text-sm text-red-800" role="alert">{{ mergeError }}</p>
        <p v-if="target" class="text-sm leading-relaxed">
          Laporan ini akan digabung ke <strong>{{ target.trackingCode }}</strong>. Dukungan, pengikut, dan komentarnya
          dipindahkan, lalu semua pengikut diberi tahu. Penggabungan tidak bisa dibatalkan.
        </p>
        <div>
          <label for="merge-note" class="mb-1.5 block text-sm font-semibold">Catatan (opsional)</label>
          <textarea
            id="merge-note"
            v-model="note"
            rows="2"
            maxlength="500"
            class="w-full rounded-2xl border border-sand-dark bg-cream px-4 py-2.5 text-sm text-maroon focus:border-maroon focus:outline-none focus:ring-2 focus:ring-lime"
          ></textarea>
        </div>
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="rounded-full border border-sand-dark bg-white px-5 py-2 text-sm font-semibold text-maroon hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
            @click="open = false"
          >
            Batal
          </button>
          <BaseButton type="button" :loading="merging" @click="merge">Gabungkan</BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<style scoped>
.candidates { display: grid; gap: 0.75rem; margin: 1rem 0 0; padding: 0; list-style: none; }
.candidate {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}
.candidate img { width: 88px; height: 66px; object-fit: cover; border-radius: var(--radius); }
.candidate__body { flex: 1 1 14rem; min-width: 0; }
.candidate__body p { margin: 0 0 0.25rem; }
.candidate__top { display: flex; align-items: center; gap: 0.5rem; }
.link { color: var(--color-primary); text-decoration: underline; }
</style>