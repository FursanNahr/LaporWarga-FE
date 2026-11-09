<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BadgeCheck, MessageCircle, MessageSquare, Paperclip, ThumbsUp, X } from 'lucide-vue-next'
import { komentarApi, parseCommentList } from '@/api/komentar.api'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import {
  COMMENT_ACCEPTED_TYPES,
  COMMENT_KIND,
  COMMENT_KIND_OPTIONS,
  COMMENT_LIMITS,
} from '@/constants/comment'
import CommentItem from './CommentItem.vue'

const replyTo = ref(null) // { parentId, name }


/**
 * DetailCommentBox: kartu "Interaksi Warga" (upvote, verifikasi, komentar) di halaman Detail.
 *
 * - Upvote dan verifikasi: angkanya dari halaman (props); tombol hanya memberi tahu lewat `toggle`.
 * - Komentar: dimuat dari BE (GET/POST /reports/:id/comments, GET /comments/:id/replies).
 *   Jumlah komentar terbaru dikabarkan ke halaman lewat event `count-change`.
 */
const props = defineProps({
  reportId: { type: [String, Number], required: true },
  counts: { type: Object, required: true }, // { upvote, verify, comments }
  mine: { type: Object, required: true }, // { upvote, verify }
  blockedReason: { type: String, default: '' },
})
const emit = defineEmits(['toggle', 'count-change'])

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { isLoggedIn, user } = useAuth()

const initial = computed(() => user.value?.name?.trim()?.[0]?.toUpperCase() ?? '?')
function goToLogin() {
  router.push({ name: 'masuk', query: { redirect: route.fullPath } })
}

const { MAX_BODY_LENGTH, MAX_FILES, IMAGE_MAX_MB, VIDEO_MAX_MB, PAGE_SIZE, REPLY_PAGE_SIZE } = COMMENT_LIMITS

// ---- Daftar komentar --------------------------------------------------------------

const comments = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const hasMore = ref(false)
const cursor = ref(null)
const loaded = ref(false)
const totalCount = ref(0)

// Sebelum daftar termuat, pakai angka dari detail laporan supaya tidak berkedip ke 0.
const total = computed(() => (loaded.value ? totalCount.value : props.counts.comments))
watch(totalCount, (value) => emit('count-change', value))

const mergeById = (current, incoming) => {
  const seen = new Set(current.map((item) => item.id))
  return [...current, ...incoming.filter((item) => !seen.has(item.id))]
}

let ticket = 0 // mengabaikan response lama kalau reportId berganti di tengah jalan

async function load(more = false) {
  if (more && loadingMore.value) return
  const current = more ? ticket : ++ticket

  if (more) {
    loadingMore.value = true
  } else {
    loading.value = true
    error.value = ''
    comments.value = []
    cursor.value = null
    hasMore.value = false
    loaded.value = false
  }

  try {
    const { data: body } = await komentarApi.list(props.reportId, {
      limit: PAGE_SIZE,
      cursor: more ? cursor.value : undefined,
    })
    if (current !== ticket) return
    const { items, meta } = parseCommentList(body)
    comments.value = more ? mergeById(comments.value, items) : items
    cursor.value = meta.nextCursor ?? null
    hasMore.value = Boolean(meta.hasMore)
    if (typeof meta.total === 'number') {
      totalCount.value = meta.total
      loaded.value = true
    }
  } catch (e) {
    if (current !== ticket) return
    const message = e.normalized?.message ?? 'Gagal memuat komentar'
    if (more) toast.error(message)
    else error.value = message
  } finally {
    if (current === ticket) {
      loading.value = false
      loadingMore.value = false
    }
  }
}

// ---- Balasan ----------------------------------------------------------------------

// Balasan yang belum tampil: sebelum dimuat = selisih replyCount; sesudahnya = masih ada cursor.
const hasMoreReplies = (comment) =>
  comment.repliesLoaded ? comment.repliesCursor !== null : (comment.replyCount ?? 0) > (comment.replies?.length ?? 0)

const remainingReplies = (comment) =>
  Math.max(0, (comment.replyCount ?? 0) - (comment.replies?.length ?? 0))

async function loadReplies(comment) {
  if (comment.repliesLoading) return
  comment.repliesLoading = true
  try {
    const { data: body } = await komentarApi.replies(comment.id, {
      limit: REPLY_PAGE_SIZE,
      cursor: comment.repliesLoaded ? (comment.repliesCursor ?? undefined) : undefined,
    })
    const { items, meta } = parseCommentList(body)
    comment.replies = comment.repliesLoaded ? mergeById(comment.replies ?? [], items) : items
    comment.repliesLoaded = true
    comment.repliesCursor = meta.nextCursor ?? null
  } catch (e) {
    toast.error(e.normalized?.message ?? 'Gagal memuat balasan')
  } finally {
    comment.repliesLoading = false
  }
}

// ---- Form komentar ----------------------------------------------------------------

const text = ref('')
const kind = ref(COMMENT_KIND.KOMENTAR)
const attachments = ref([]) // [{ file, url, isVideo }]
const fileInput = ref(null)
const textarea = ref(null)
const submitting = ref(false)
const progress = ref(0)
const bodyError = ref('')

const acceptAttr = [...COMMENT_ACCEPTED_TYPES.image, ...COMMENT_ACCEPTED_TYPES.video].join(',')
const canSubmit = computed(() => text.value.trim().length > 0 && !submitting.value)
const submitLabel = computed(() => {
  if (!submitting.value) return replyTo.value ? 'Kirim Balasan' : 'Kirim Komentar'
  return attachments.value.length && progress.value < 100 ? `Mengunggah ${progress.value}%` : 'Mengirim...'
})

function onPick(event) {
  const picked = [...event.target.files]
  event.target.value = ''
  for (const file of picked) {
    const isImage = COMMENT_ACCEPTED_TYPES.image.includes(file.type)
    const isVideo = COMMENT_ACCEPTED_TYPES.video.includes(file.type)
    if (!isImage && !isVideo) {
      toast.error(`${file.name}: format harus JPG, PNG, WEBP, MP4, WEBM, atau MOV.`)
      continue
    }
    const maxMb = isVideo ? VIDEO_MAX_MB : IMAGE_MAX_MB
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`${file.name} lebih dari ${maxMb} MB.`)
      continue
    }
    if (attachments.value.length >= MAX_FILES) {
      toast.info(`Maksimal ${MAX_FILES} file per komentar.`)
      break
    }
    attachments.value.push({ file, url: URL.createObjectURL(file), isVideo })
  }
}

function removeAttachment(index) {
  URL.revokeObjectURL(attachments.value[index].url)
  attachments.value.splice(index, 1)
}

function clearAttachments() {
  attachments.value.forEach((attachment) => URL.revokeObjectURL(attachment.url))
  attachments.value = []
}

function startReply(comment) {
  // BE hanya mengenal satu tingkat: membalas sebuah balasan dialihkan ke komentar induknya.
  replyTo.value = { parentId: comment.parentId ?? comment.id, name: comment.author?.name ?? 'komentar' }
  nextTick(() => textarea.value?.focus())
}

function cancelReply() {
  replyTo.value = null
}

function addLocal(created) {
  if (created.parentId) {
    const parent = comments.value.find((item) => item.id === created.parentId)
    if (parent) {
      parent.replies = mergeById(parent.replies ?? [], [created])
      parent.replyCount = (parent.replyCount ?? 0) + 1
    }
  } else {
    comments.value.unshift({ ...created, replies: created.replies ?? [], replyCount: created.replyCount ?? 0 })
  }
  totalCount.value += 1
}

async function submit() {
  if (!canSubmit.value) return

  const form = new FormData()
  form.append('body', text.value.trim())
  form.append('kind', kind.value)
  if (replyTo.value) form.append('parentId', replyTo.value.parentId)
  attachments.value.forEach(({ file }) => form.append('files', file))

  submitting.value = true
  progress.value = 0
  bodyError.value = ''
  try {
    const { data: body } = await komentarApi.create(props.reportId, form, {
      onUploadProgress: (event) => {
        if (event.total) progress.value = Math.round((event.loaded / event.total) * 100)
      },
    })
    addLocal(body.data)
    toast.success(replyTo.value ? 'Balasan terkirim.' : 'Komentar terkirim.')
    text.value = ''
    kind.value = COMMENT_KIND.KOMENTAR
    replyTo.value = null
    clearAttachments()
  } catch (e) {
    bodyError.value = e.normalized?.fieldErrors?.body ?? ''
    toast.error(e.normalized?.message ?? 'Gagal mengirim komentar')
  } finally {
    submitting.value = false
  }
}

watch(
  () => props.reportId,
  () => {
    cancelReply()
    clearAttachments()
    load()
  },
  { immediate: true },
)

onBeforeUnmount(clearAttachments)

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
        <div v-if="replyTo" class="mb-2 ml-14 flex items-center justify-between gap-2 rounded-full bg-sand px-3 py-1 text-xs font-semibold">
          <span class="truncate">Membalas {{ replyTo.name }}</span>
          <button type="button" class="grid size-5 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-sand-dark" aria-label="Batal membalas" @click="cancelReply">
            <X class="size-3.5" aria-hidden="true" />
          </button>
        </div>

        <div class="flex items-start gap-3">
          <span class="grid size-11 shrink-0 place-items-center rounded-full bg-maroon text-base font-bold text-lime" aria-hidden="true">{{ initial }}</span>
          <div class="min-w-0 flex-1">
            <div class="relative">
              <label for="comment-input" class="sr-only">Tulis komentar</label>
              <textarea
                id="comment-input"
                ref="textarea"
                v-model="text"
                rows="2"
                :maxlength="MAX_BODY_LENGTH"
                :placeholder="replyTo ? 'Tulis balasan...' : 'Tulis komentar...'"
                class="w-full resize-none rounded-2xl border bg-white/80 py-2.5 pl-4 pr-12 text-sm placeholder:text-maroon/50 focus:border-maroon focus:outline-none"
                :class="bodyError ? 'border-red-600' : 'border-sand-dark'"
                :aria-invalid="Boolean(bodyError)"
                @keydown.ctrl.enter.prevent="submit"
                @keydown.meta.enter.prevent="submit"
              ></textarea>
              <button
                type="button"
                class="absolute right-1.5 top-2 grid size-8 cursor-pointer place-items-center rounded-full hover:bg-sand"
                aria-label="Lampirkan foto atau video bukti"
                title="Lampirkan foto atau video bukti"
                @click="fileInput.click()"
              >
                <Paperclip class="size-5" aria-hidden="true" />
              </button>
              <input ref="fileInput" type="file" :accept="acceptAttr" multiple class="hidden" @change="onPick" />
            </div>
            <p v-if="bodyError" class="mt-1 text-xs font-semibold text-red-700" role="alert">{{ bodyError }}</p>

            <div class="mt-2 flex items-center justify-between gap-3">
              <label class="flex min-w-0 items-center gap-2 text-xs font-semibold">
                <span class="shrink-0">Jenis</span>
                <select
                  v-model="kind"
                  class="h-8 min-w-0 cursor-pointer rounded-full border border-sand-dark bg-white/80 px-3 text-xs font-semibold focus:border-maroon focus:outline-none"
                >
                  <option v-for="option in COMMENT_KIND_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
              </label>
              <span class="shrink-0 text-[11px] text-maroon/60">{{ text.length }}/{{ MAX_BODY_LENGTH }}</span>
            </div>
          </div>
        </div>

        <ul v-if="attachments.length" class="mt-3 flex flex-wrap gap-2 pl-14">
          <li v-for="(attachment, index) in attachments" :key="attachment.url" class="relative">
            <video v-if="attachment.isVideo" :src="attachment.url" muted preload="metadata" class="size-16 rounded-lg border border-sand-dark bg-black object-cover" aria-label="Pratinjau video bukti"></video>
            <img v-else :src="attachment.url" alt="Pratinjau foto bukti" class="size-16 rounded-lg border border-sand-dark object-cover" />
            <span v-if="attachment.isVideo" class="absolute bottom-1 left-1 rounded bg-maroon/80 px-1 text-[9px] font-bold text-white">Video</span>
            <button
              type="button"
              class="absolute -right-1.5 -top-1.5 grid size-5 cursor-pointer place-items-center rounded-full bg-maroon text-white"
              aria-label="Hapus lampiran"
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
        >{{ submitLabel }}</button>
      </div>

      <button
        v-else
        type="button"
        class="h-11 w-full cursor-pointer rounded-full border border-maroon text-sm font-bold hover:bg-sand"
        @click="goToLogin"
      >Masuk untuk berkomentar</button>

      <!-- Daftar komentar -->
      <h3 class="mt-5 text-sm font-extrabold">Komentar</h3>

      <p v-if="loading" class="mt-3 text-sm text-maroon/70">Memuat komentar...</p>

      <div v-else-if="error" class="mt-3 text-sm" role="alert">
        <p class="text-maroon/80">{{ error }}</p>
        <button type="button" class="mt-2 cursor-pointer rounded-full border border-maroon px-4 py-1.5 text-xs font-bold hover:bg-sand" @click="load()">Coba lagi</button>
      </div>

      <template v-else>
        <ul v-if="comments.length" class="mt-3 max-h-[28rem] space-y-5 overflow-y-auto pr-1">
          <li v-for="comment in comments" :key="comment.id">
            <CommentItem :comment="comment" :can-reply="isLoggedIn" @reply="startReply" />

            <div
              v-if="comment.replies?.length || hasMoreReplies(comment)"
              class="ml-12 mt-3 space-y-3 border-l-2 border-sand-dark/60 pl-3"
            >
              <button
                v-if="hasMoreReplies(comment)"
                type="button"
                class="cursor-pointer text-xs font-bold text-maroon/70 hover:text-maroon disabled:cursor-wait"
                :disabled="comment.repliesLoading"
                @click="loadReplies(comment)"
              >
                {{
                  comment.repliesLoading
                    ? 'Memuat balasan...'
                    : comment.repliesLoaded
                      ? 'Muat balasan berikutnya'
                      : `Lihat ${remainingReplies(comment)} balasan lainnya`
                }}
              </button>
              <CommentItem
                v-for="reply in comment.replies"
                :key="reply.id"
                :comment="reply"
                :can-reply="isLoggedIn"
                compact
                @reply="startReply"
              />
            </div>
          </li>
        </ul>
        <p v-else class="mt-3 text-sm text-maroon/70">Belum ada komentar. Jadilah yang pertama menanggapi.</p>

        <button
          v-if="hasMore"
          type="button"
          class="mt-4 h-10 w-full cursor-pointer rounded-full border border-sand-dark text-sm font-bold hover:bg-sand disabled:cursor-wait disabled:opacity-60"
          :disabled="loadingMore"
          @click="load(true)"
        >{{ loadingMore ? 'Memuat...' : 'Muat komentar lainnya' }}</button>
      </template>
    </div>
  </section>
</template>