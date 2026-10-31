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
  <div>
    <p class="hint">
      Cari laporan sejenis dalam radius 200 m. Laporan ini akan digabung ke laporan utama yang kamu pilih.
    </p>
    <button type="button" class="btn" :aria-busy="searching" @click="search">
      {{ searching ? 'Mencari...' : candidates ? 'Cari ulang' : 'Cari kandidat duplikat' }}
    </button>

    <p v-if="searchError" class="alert alert--error" role="alert">{{ searchError }}</p>
    <p v-if="candidates && !candidates.length" class="muted">Tidak ada kandidat duplikat di sekitar lokasi ini.</p>

    <ul v-if="candidates?.length" class="candidates">
      <li v-for="candidate in candidates" :key="candidate.id" class="candidate">
        <img v-if="candidate.photos?.[0]" :src="assetUrl(candidate.photos[0].url)" :alt="`Foto ${candidate.trackingCode}`" loading="lazy" />
        <div class="candidate__body">
          <p class="candidate__top">
            <RouterLink :to="{ name: 'admin-detail-laporan', params: { id: candidate.id } }" class="link" target="_blank">
              {{ candidate.trackingCode }}
            </RouterLink>
            <StatusBadge :status="candidate.status" />
          </p>
          <p class="clamp">{{ candidate.description }}</p>
          <p class="hint">
            {{ formatDistance(candidate.distanceMeters) }} dari laporan ini, {{ formatDate(candidate.createdAt) }},
            {{ candidate.supportCount }} dukungan
          </p>
        </div>
        <button type="button" class="btn btn--sm" @click="choose(candidate)">Jadikan laporan utama</button>
      </li>
    </ul>

    <BaseModal v-model="open" title="Gabungkan laporan duplikat">
      <div class="admin-page admin-modal">
        <p v-if="mergeError" class="alert alert--error" role="alert">{{ mergeError }}</p>
        <p v-if="target">
          Laporan ini akan digabung ke <strong>{{ target.trackingCode }}</strong>. Dukungan, pengikut, dan komentarnya
          dipindahkan, lalu semua pengikut diberi tahu. Penggabungan tidak bisa dibatalkan.
        </p>
        <div class="field">
          <label for="merge-note">Catatan (opsional)</label>
          <textarea id="merge-note" v-model="note" class="control" rows="2" maxlength="500"></textarea>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn" @click="open = false">Batal</button>
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