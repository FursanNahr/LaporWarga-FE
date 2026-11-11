<script setup>
import { ref } from 'vue'
import { Eye, EyeOff, RotateCcw, Search } from 'lucide-vue-next'
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
const KIND_TONE = {
  KOMENTAR: 'bg-white text-maroon',
  BUKTI_PENDUKUNG: 'bg-sky-100 text-sky-900',
  LAPORAN_LAIN: 'bg-amber-100 text-amber-900',
  SANGGAHAN: 'bg-red-100 text-red-800',
}

// Dua huruf awal nama untuk avatar.
const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('') || '?'

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

const alertClass = 'rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-sm font-semibold text-red-800'
const controlClass =
  'h-11 w-full cursor-pointer rounded-full border border-sand-dark bg-white/70 px-4 text-sm text-maroon focus:border-maroon focus:outline-none'
const labelClass = 'mb-1 block pl-3 text-xs font-semibold text-maroon/70'
const actionBtn =
  'inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border-2 px-4 text-sm font-bold transition-colors'
</script>

<template>
  <section class="mx-auto w-full max-w-[1400px] px-5 py-8 lg:px-8">
    <header>
      <h1 class="text-4xl font-extrabold tracking-tight text-maroon sm:text-5xl">
        <span class="relative inline-block">
          Moderasi
          <svg
            class="absolute -bottom-1.5 left-0 h-2.5 w-full"
            viewBox="0 0 200 12"
            preserveAspectRatio="none"
            fill="none"
            aria-hidden="true"
          >
            <path d="M2 8C45 2 120 2 198 7" stroke="#c1f52f" stroke-width="4" stroke-linecap="round" />
          </svg>
        </span>
        komentar
      </h1>
      <p class="mt-3 max-w-2xl text-lg text-maroon/80">
        Komentar yang disembunyikan tidak tampil di publik, tetapi tetap tersimpan. Penulisnya diberi tahu beserta alasannya.
      </p>
    </header>

    <!-- Filter -->
    <form class="mt-8 grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end" role="search" @submit.prevent>
      <div class="sm:col-span-2 lg:w-80">
        <label for="c-q" :class="labelClass">Cari isi komentar</label>
        <div class="relative">
          <Search class="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-maroon" aria-hidden="true" />
          <input
            id="c-q"
            v-model="filters.q"
            type="search"
            placeholder="Kata kunci"
            class="h-11 w-full rounded-full border border-sand-dark bg-white/70 pl-11 pr-4 text-sm text-maroon placeholder:text-maroon/50 focus:border-maroon focus:outline-none"
          />
        </div>
        <p v-if="keywordTooShort" class="mt-1.5 pl-4 text-xs text-maroon/70">Kata kunci minimal 2 karakter.</p>
      </div>
      <div class="lg:w-44">
        <label for="c-hidden" :class="labelClass">Status</label>
        <select id="c-hidden" v-model="filters.hidden" :class="controlClass">
          <option value="">Semua</option>
          <option value="false">Tampil</option>
          <option value="true">Disembunyikan</option>
        </select>
      </div>
      <div class="lg:w-48">
        <label for="c-kind" :class="labelClass">Jenis</label>
        <select id="c-kind" v-model="filters.kind" :class="controlClass">
          <option value="">Semua jenis</option>
          <option v-for="(label, key) in KIND_LABEL" :key="key" :value="key">{{ label }}</option>
        </select>
      </div>
      <button
        v-if="hasFilter"
        type="button"
        class="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-maroon px-5 text-sm font-bold text-maroon transition-colors hover:bg-maroon hover:text-white"
        @click="reset"
      >
        <RotateCcw class="size-4" aria-hidden="true" /> Atur ulang
      </button>
    </form>

    <p v-if="error" :class="[alertClass, 'mt-6']" role="alert">{{ error }}</p>
    <BaseLoading v-if="loading" class="mt-10" text="Memuat komentar..." />
    <BaseEmptyState
      v-else-if="!items.length && !error"
      class="mt-10"
      :title="hasFilter ? 'Tidak ada komentar yang cocok' : 'Belum ada komentar'"
    />

    <!-- Daftar komentar -->
    <ul v-else class="mt-6 space-y-4">
      <li v-for="comment in items" :key="comment.id">
        <article
          class="rounded-2xl border p-5 sm:p-6"
          :class="comment.isHidden ? 'border-dashed border-maroon/30 bg-sand/50' : 'border-sand-dark bg-sand'"
        >
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="flex min-w-0 items-start gap-3">
              <span
                class="grid size-11 shrink-0 place-items-center rounded-full text-base font-extrabold"
                :class="comment.isHidden ? 'bg-white text-maroon/50' : 'bg-lime text-maroon-dark'"
                aria-hidden="true"
              >{{ initials(comment.user.name) }}</span>

              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <strong class="break-words font-extrabold text-maroon">{{ comment.user.name }}</strong>
                  <span class="rounded-full px-2.5 py-0.5 text-xs font-bold" :class="KIND_TONE[comment.kind] ?? KIND_TONE.KOMENTAR">
                    {{ KIND_LABEL[comment.kind] ?? comment.kind }}
                  </span>
                  <span v-if="comment.isHidden" class="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white">Disembunyikan</span>
                </div>
                <p class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-maroon/70">
                  <span class="break-all">{{ comment.user.email }}</span>
                  <span aria-hidden="true">·</span>
                  <time :datetime="comment.createdAt">{{ formatDateTime(comment.createdAt) }}</time>
                  <span aria-hidden="true">·</span>
                  <span>pada laporan</span>
                  <RouterLink
                    :to="{ name: 'admin-detail-laporan', params: { id: comment.report.id } }"
                    class="rounded-lg bg-white px-2.5 py-0.5 font-extrabold tracking-wide text-maroon ring-1 ring-sand-dark transition-colors hover:bg-lime"
                  >{{ comment.report.trackingCode }}</RouterLink>
                </p>
              </div>
            </div>

            <div class="shrink-0">
              <button
                v-if="!comment.isHidden"
                type="button"
                :class="[actionBtn, 'border-red-700 text-red-700 hover:bg-red-700 hover:text-white']"
                @click="askHide(comment)"
              >
                <EyeOff class="size-4" aria-hidden="true" /> Sembunyikan
              </button>
              <button
                v-else
                type="button"
                :class="[actionBtn, 'border-lime-dark bg-lime text-maroon-dark hover:bg-lime-dark']"
                @click="unhide(comment)"
              >
                <Eye class="size-4" aria-hidden="true" /> Tampilkan kembali
              </button>
            </div>
          </div>

          <p class="mt-4 whitespace-pre-wrap leading-relaxed text-maroon [overflow-wrap:anywhere]" :class="{ 'opacity-70': comment.isHidden }">{{ comment.body }}</p>

          <ul v-if="comment.photos?.length" class="mt-4 flex flex-wrap gap-3">
            <li v-for="photo in comment.photos" :key="photo.id">
              <a
                :href="assetUrl(photo.url)"
                target="_blank"
                rel="noopener"
                class="block size-24 overflow-hidden rounded-xl border border-sand-dark bg-white transition-transform hover:-translate-y-0.5 sm:size-28"
              >
                <img :src="assetUrl(photo.url)" alt="Foto pada komentar" loading="lazy" class="size-full object-cover" />
              </a>
            </li>
          </ul>

          <p
            v-if="comment.isHidden"
            class="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-900"
          >
            <EyeOff class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              <strong>Alasan:</strong> {{ comment.hiddenReason }}<template v-if="comment.hiddenBy">, oleh {{ comment.hiddenBy.name }}</template><template v-if="comment.hiddenAt">, {{ formatDateTime(comment.hiddenAt) }}</template>
            </span>
          </p>
        </article>
      </li>
    </ul>

    <BasePagination :has-more="hasMore" :loading="loadingMore" @load-more="loadMore" />

    <!-- Modal sembunyikan -->
    <BaseModal v-model="open" title="Sembunyikan komentar">
      <form class="space-y-4 text-maroon" novalidate @submit.prevent="hide">
        <p v-if="modalError" :class="alertClass" role="alert">{{ modalError }}</p>
        <p
          v-if="target"
          class="max-h-40 overflow-auto whitespace-pre-wrap rounded-xl border-l-4 border-maroon/40 bg-sand px-4 py-3 text-sm leading-relaxed [overflow-wrap:anywhere]"
        >{{ target.body }}</p>
        <div>
          <label for="hide-reason" class="mb-1.5 block text-sm font-semibold">Alasan (dikirim ke penulis komentar)</label>
          <textarea
            id="hide-reason"
            v-model="reason"
            rows="3"
            maxlength="255"
            class="w-full rounded-2xl border border-maroon/25 bg-white/60 px-5 py-3 text-sm text-maroon focus:border-maroon focus:outline-none focus:ring-2 focus:ring-lime"
          ></textarea>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="secondary" @click="open = false">Batal</BaseButton>
          <BaseButton type="submit" variant="danger" :loading="working">Sembunyikan</BaseButton>
        </div>
      </form>
    </BaseModal>
  </section>
</template>