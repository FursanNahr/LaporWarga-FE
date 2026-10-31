<script setup>
import { ref } from 'vue'
import { assetUrl } from '@/api'
import { adminApi } from '@/api/admin.api'
import { useFilteredList } from '@/composables/useFilteredList'
import { useToast } from '@/composables/useToast'
import { formatDateTime } from '@/utils/formatDate'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseEmptyState from '@/components/common/BaseEmptyState.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BasePagination from '@/components/common/BasePagination.vue'

const toast = useToast()

// Nama jenis komentar dari BE (enum CommentKind).
const KIND_LABEL = {
  KOMENTAR: 'Komentar',
  BUKTI_PENDUKUNG: 'Bukti pendukung',
  LAPORAN_LAIN: 'Laporan lain',
  SANGGAHAN: 'Sanggahan',
}

const { filters, items, loading, loadingMore, error, hasMore, loadMore, reset, hasFilter, keywordTooShort } =
  useFilteredList(adminApi.listKomentar, { initial: { q: '', hidden: '', kind: '' }, limit: 15 })

// ---- Sembunyikan (alasan wajib) ----
const open = ref(false)
const target = ref(null)
const reason = ref('')
const working = ref(false)
const modalError = ref('')

function askHide(comment) {
  target.value = comment
  reason.value = ''
  modalError.value = ''
  open.value = true
}

async function moderate(comment, payload) {
  const { data: body } = await adminApi.moderasiKomentar(comment.id, payload)
  Object.assign(comment, body.data) // perbarui kartu tanpa memuat ulang daftar
}

async function hide() {
  if (working.value) return
  if (reason.value.trim().length < 3) {
    modalError.value = 'Alasan minimal 3 karakter.'
    return
  }
  working.value = true
  modalError.value = ''
  try {
    await moderate(target.value, { hidden: true, reason: reason.value.trim() })
    open.value = false
    toast.success('Komentar disembunyikan. Penulisnya diberi tahu.')
  } catch (e) {
    modalError.value = e.normalized?.message ?? 'Gagal menyembunyikan komentar.'
  } finally {
    working.value = false
  }
}

async function unhide(comment) {
  try {
    await moderate(comment, { hidden: false })
    toast.success('Komentar ditampilkan kembali.')
  } catch (e) {
    toast.error(e.normalized?.message ?? 'Gagal menampilkan komentar.')
  }
}
</script>

<template>
  <section class="container admin-page">
    <header class="page-header">
      <div>
        <h1>Moderasi komentar</h1>
        <p>Komentar yang disembunyikan tidak tampil di publik, tetapi tetap tersimpan. Penulisnya diberi tahu beserta alasannya.</p>
      </div>
    </header>

    <form class="filters" role="search" @submit.prevent>
      <div class="filters__field filters__field--grow">
        <label for="c-q">Cari isi komentar</label>
        <input id="c-q" v-model="filters.q" class="control" type="search" placeholder="Kata kunci" />
        <small v-if="keywordTooShort" class="hint">Kata kunci minimal 2 karakter.</small>
      </div>
      <div class="filters__field">
        <label for="c-hidden">Status</label>
        <select id="c-hidden" v-model="filters.hidden" class="control">
          <option value="">Semua</option>
          <option value="false">Tampil</option>
          <option value="true">Disembunyikan</option>
        </select>
      </div>
      <div class="filters__field">
        <label for="c-kind">Jenis</label>
        <select id="c-kind" v-model="filters.kind" class="control">
          <option value="">Semua jenis</option>
          <option v-for="(label, key) in KIND_LABEL" :key="key" :value="key">{{ label }}</option>
        </select>
      </div>
      <button v-if="hasFilter" type="button" class="btn" @click="reset">Atur ulang</button>
    </form>

    <p v-if="error" class="alert alert--error" role="alert">{{ error }}</p>
    <BaseLoading v-if="loading" text="Memuat komentar..." />
    <BaseEmptyState v-else-if="!items.length && !error" :title="hasFilter ? 'Tidak ada komentar yang cocok' : 'Belum ada komentar'" />

    <ul v-else class="comments">
      <li v-for="comment in items" :key="comment.id" class="panel comment" :class="{ 'comment--hidden': comment.isHidden }">
        <div class="comment__head">
          <div>
            <strong>{{ comment.user.name }}</strong>
            <span class="tag">{{ KIND_LABEL[comment.kind] ?? comment.kind }}</span>
            <span v-if="comment.isHidden" class="tag tag--danger">Disembunyikan</span>
            <p class="hint">
              {{ comment.user.email }}, {{ formatDateTime(comment.createdAt) }}, pada laporan
              <RouterLink :to="{ name: 'admin-detail-laporan', params: { id: comment.report.id } }" class="link">{{ comment.report.trackingCode }}</RouterLink>
            </p>
          </div>
          <div class="row">
            <button v-if="!comment.isHidden" type="button" class="btn btn--sm btn--danger" @click="askHide(comment)">Sembunyikan</button>
            <button v-else type="button" class="btn btn--sm" @click="unhide(comment)">Tampilkan kembali</button>
          </div>
        </div>

        <p class="comment__body">{{ comment.body }}</p>

        <ul v-if="comment.photos?.length" class="thumbs">
          <li v-for="photo in comment.photos" :key="photo.id">
            <a :href="assetUrl(photo.url)" target="_blank" rel="noopener">
              <img :src="assetUrl(photo.url)" alt="Foto pada komentar" loading="lazy" />
            </a>
          </li>
        </ul>

        <p v-if="comment.isHidden" class="hint">
          Alasan: {{ comment.hiddenReason }}<template v-if="comment.hiddenBy">, oleh {{ comment.hiddenBy.name }}</template>
          <template v-if="comment.hiddenAt">, {{ formatDateTime(comment.hiddenAt) }}</template>
        </p>
      </li>
    </ul>

    <BasePagination :has-more="hasMore" :loading="loadingMore" @load-more="loadMore" />

    <BaseModal v-model="open" title="Sembunyikan komentar">
      <form class="admin-page admin-modal" novalidate @submit.prevent="hide">
        <p v-if="modalError" class="alert alert--error" role="alert">{{ modalError }}</p>
        <p v-if="target" class="quote">{{ target.body }}</p>
        <div class="field">
          <label for="hide-reason">Alasan (dikirim ke penulis komentar)</label>
          <textarea id="hide-reason" v-model="reason" class="control" rows="3" maxlength="255"></textarea>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn" @click="open = false">Batal</button>
          <BaseButton type="submit" :loading="working">Sembunyikan</BaseButton>
        </div>
      </form>
    </BaseModal>
  </section>
</template>

<style scoped>
.comments { display: grid; gap: 0.75rem; margin: 0 0 1.25rem; padding: 0; list-style: none; }
.comment { margin-bottom: 0; }
.comment--hidden { background: var(--color-bg-soft); }
.comment__head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.75rem; }
.comment__head p { margin: 0.25rem 0 0; }
.comment__body { margin: 0.75rem 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.link { color: var(--color-primary); text-decoration: underline; }
.quote {
  margin: 0 0 1rem;
  padding: 0.5rem 0.75rem;
  border-left: 3px solid var(--color-border);
  color: var(--color-text-muted);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>