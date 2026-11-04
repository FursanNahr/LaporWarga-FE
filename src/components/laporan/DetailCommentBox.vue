<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BadgeCheck, MessageCircle, MessageSquare, Paperclip, ThumbsUp, X } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { COMMENTS_DUMMY } from '@/constants/commentDummy'
import { timeAgo } from '@/utils/formatDate'
import { humanizeEnum } from '@/utils/formatStatus'

/**
 * DetailCommentBox: kartu "Interaksi Warga" (upvote, verifikasi, komentar) di halaman Detail.
 *
 * - Upvote dan verifikasi: angkanya dari halaman (props); tombol hanya memberi tahu lewat `toggle`.
 * - Komentar: DUMMY. Belum ada endpoint, jadi daftar dan pengirimannya hanya di layar ini.
 *   Cari penanda "DUMMY" di bawah untuk bagian yang harus diganti nanti.
 */
const props = defineProps({
  counts: { type: Object, required: true }, // { upvote, verify, comments }
  mine: { type: Object, required: true }, // { upvote, verify }
  blockedReason: { type: String, default: '' },
})
const emit = defineEmits(['toggle'])

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { isLoggedIn, user, role } = useAuth()

const initial = computed(() => user.value?.name?.trim()?.[0]?.toUpperCase() ?? '?')
function goToLogin() {
  router.push({ name: 'masuk', query: { redirect: route.fullPath } })
}

// ---- Komentar (DUMMY) -------------------------------------------------------------

const IS_DUMMY = true // DUMMY: hapus saat endpoint komentar sudah ada
const comments = ref(IS_DUMMY ? [...COMMENTS_DUMMY] : [])
const total = computed(() => (IS_DUMMY ? comments.value.length : props.counts.comments))

const MAX_FILES = 3
const MAX_BYTES = 5 * 1024 * 1024
const text = ref('')
const attachments = ref([]) // [{ file, url }]
const fileInput = ref(null)

function onPick(event) {
  const picked = [...event.target.files]
  event.target.value = ''
  for (const file of picked) {
    if (!file.type.startsWith('image/')) {
      toast.error('Lampiran harus berupa foto.')
      continue
    }
    if (file.size > MAX_BYTES) {
      toast.error(`${file.name} lebih dari 5 MB.`)
      continue
    }
    if (attachments.value.length >= MAX_FILES) {
      toast.info(`Maksimal ${MAX_FILES} foto per komentar.`)
      break
    }
    attachments.value.push({ file, url: URL.createObjectURL(file) })
  }
}

function removeAttachment(index) {
  URL.revokeObjectURL(attachments.value[index].url)
  attachments.value.splice(index, 1)
}

const canSubmit = computed(() => text.value.trim().length > 0 || attachments.value.length > 0)

// DUMMY: ganti dengan pemanggilan API komentar (teks + foto bukti), lalu muat ulang daftarnya.
function submit() {
  if (!canSubmit.value) return
  comments.value.unshift({
    id: `local-${Date.now()}`,
    authorName: user.value?.name ?? 'Kamu',
    authorRole: role.value?.toUpperCase(),
    text: text.value.trim(),
    photos: attachments.value.map((attachment) => attachment.url),
    createdAt: new Date().toISOString(),
  })
  text.value = ''
  attachments.value = [] // URL foto dipakai daftar komentar; dibersihkan saat komponen dilepas
}

onBeforeUnmount(() => {
  attachments.value.forEach((attachment) => URL.revokeObjectURL(attachment.url))
  comments.value.forEach((comment) =>
    comment.photos.filter((url) => url.startsWith('blob:')).forEach((url) => URL.revokeObjectURL(url)),
  )
})

const statButton =
  'flex cursor-pointer flex-col items-center gap-1 rounded-xl px-2 py-2 transition-colors hover:bg-white/70 ' +
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-50'
</script>

<template>
  <section class="overflow-hidden rounded-3xl border border-sand-dark/70 bg-white/70" aria-labelledby="interaksi-warga">
    <h2 id="interaksi-warga" class="flex items-center gap-3 bg-sand/80 px-5 py-4 text-lg font-extrabold">
      <MessageSquare class="size-6" aria-hidden="true" /> Interaksi Warga
    </h2>

    <div class="grid grid-cols-3 divide-x divide-sand-dark/70 bg-sand/60 px-2 py-3 text-center">
      <button
        type="button"
        :class="statButton"
        :aria-pressed="mine.upvote"
        :aria-disabled="Boolean(blockedReason)"
        :title="blockedReason || 'Dukung agar laporan ini diprioritaskan'"
        @click="emit('toggle', 'upvote')"
      >
        <span class="text-2xl font-extrabold">{{ counts.upvote }}</span>
        <span class="inline-flex items-center gap-1.5 text-sm font-semibold" :class="{ '[&>svg]:fill-lime': mine.upvote }">
          <ThumbsUp class="size-[18px]" aria-hidden="true" /> Upvote
        </span>
      </button>

      <button
        type="button"
        :class="statButton"
        :aria-pressed="mine.verify"
        :aria-disabled="Boolean(blockedReason)"
        :title="blockedReason || 'Konfirmasi bahwa masalah ini benar ada'"
        @click="emit('toggle', 'verify')"
      >
        <span class="text-2xl font-extrabold">{{ counts.verify }}</span>
        <span class="inline-flex items-center gap-1.5 text-sm font-semibold" :class="{ '[&>svg]:fill-lime': mine.verify }">
          <BadgeCheck class="size-[18px]" aria-hidden="true" /> Verifikasi
        </span>
      </button>

      <div class="flex flex-col items-center gap-1 px-2 py-2">
        <span class="text-2xl font-extrabold">{{ total }}</span>
        <span class="inline-flex items-center gap-1.5 text-sm font-semibold">
          <MessageCircle class="size-[18px]" aria-hidden="true" /> Komentar
        </span>
      </div>
    </div>

    <div id="komentar" class="scroll-mt-28 px-5 py-4">
      <!-- Form komentar: hanya untuk yang sudah masuk -->
      <div v-if="isLoggedIn">
        <div class="flex items-start gap-3">
          <span class="grid size-11 shrink-0 place-items-center rounded-full bg-maroon text-base font-bold text-lime" aria-hidden="true">{{ initial }}</span>
          <div class="relative min-w-0 flex-1">
            <label for="comment-input" class="sr-only">Tulis komentar</label>
            <input
              id="comment-input"
              v-model="text"
              type="text"
              maxlength="500"
              placeholder="Tulis komentar..."
              class="h-11 w-full rounded-full border border-sand-dark bg-white/80 pl-4 pr-12 text-sm placeholder:text-maroon/50 focus:border-maroon focus:outline-none"
              @keydown.enter.prevent="submit"
            />
            <button
              type="button"
              class="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full hover:bg-sand"
              aria-label="Lampirkan foto bukti"
              title="Lampirkan foto bukti"
              @click="fileInput.click()"
            >
              <Paperclip class="size-5" aria-hidden="true" />
            </button>
            <input ref="fileInput" type="file" accept="image/*" multiple class="hidden" @change="onPick" />
          </div>
        </div>

        <ul v-if="attachments.length" class="mt-3 flex flex-wrap gap-2 pl-14">
          <li v-for="(attachment, index) in attachments" :key="attachment.url" class="relative">
            <img :src="attachment.url" alt="Pratinjau foto bukti" class="size-16 rounded-lg border border-sand-dark object-cover" />
            <button
              type="button"
              class="absolute -right-1.5 -top-1.5 grid size-5 cursor-pointer place-items-center rounded-full bg-maroon text-white"
              aria-label="Hapus foto"
              @click="removeAttachment(index)"
            >
              <X class="size-3" aria-hidden="true" />
            </button>
          </li>
        </ul>

        <button
          type="button"
          class="mt-3 h-11 w-full cursor-pointer rounded-full bg-maroon text-sm font-bold text-white transition-colors hover:bg-maroon-dark disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!canSubmit"
          @click="submit"
        >Kirim Komentar</button>
      </div>

      <button
        v-else
        type="button"
        class="h-11 w-full cursor-pointer rounded-full border border-maroon text-sm font-bold hover:bg-sand"
        @click="goToLogin"
      >Masuk untuk berkomentar</button>

      <!-- Daftar komentar -->
      <div class="mt-5 flex items-center justify-between">
        <h3 class="text-sm font-extrabold">Komentar</h3>
        <span v-if="IS_DUMMY" class="rounded-full bg-sand px-2.5 py-0.5 text-[11px] font-bold" title="Belum tersambung ke server">Contoh tampilan</span>
      </div>

      <ul v-if="comments.length" class="mt-3 max-h-96 space-y-4 overflow-y-auto pr-1">
        <li v-for="comment in comments" :key="comment.id" class="flex gap-3">
          <span class="grid size-9 shrink-0 place-items-center rounded-full bg-sand-dark text-sm font-bold" aria-hidden="true">
            {{ comment.authorName?.trim()?.[0]?.toUpperCase() ?? '?' }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-sm">
              <strong class="font-bold">{{ comment.authorName }}</strong>
              <span v-if="comment.authorRole && comment.authorRole !== 'WARGA'" class="ml-1.5 rounded-full bg-lime/50 px-2 py-0.5 text-[10px] font-bold">{{ humanizeEnum(comment.authorRole) }}</span>
              <span class="ml-1.5 text-xs text-maroon/60">{{ timeAgo(comment.createdAt) }}</span>
            </p>
            <p v-if="comment.text" class="mt-0.5 whitespace-pre-line break-words text-sm">{{ comment.text }}</p>
            <ul v-if="comment.photos?.length" class="mt-2 flex flex-wrap gap-2">
              <li v-for="photo in comment.photos" :key="photo">
                <a :href="photo" target="_blank" rel="noopener">
                  <img :src="photo" alt="Foto bukti komentar" class="size-20 rounded-lg border border-sand-dark object-cover" />
                </a>
              </li>
            </ul>
          </div>
        </li>
      </ul>
      <p v-else class="mt-3 text-sm text-maroon/70">Belum ada komentar. Jadilah yang pertama menanggapi.</p>
    </div>
  </section>
</template>