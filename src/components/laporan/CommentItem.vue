<script setup>
import { computed } from 'vue'
import { EyeOff } from 'lucide-vue-next'
import { assetUrl } from '@/api'
import { COMMENT_KIND, COMMENT_KIND_LABEL } from '@/constants/comment'
import { timeAgo } from '@/utils/formatDate'
import { humanizeEnum } from '@/utils/formatStatus'

/**
 * CommentItem: satu komentar atau balasan, murni tampilan.
 * Bentuk `comment` mengikuti DTO BE (comment.service.js > toCommentDto).
 */
const props = defineProps({
  comment: { type: Object, required: true },
  canReply: { type: Boolean, default: false },
  compact: { type: Boolean, default: false }, // true untuk balasan: avatar lebih kecil
})
const emit = defineEmits(['reply'])

const author = computed(() => props.comment.author ?? {})
const initial = computed(() => author.value.name?.trim()?.[0]?.toUpperCase() ?? '?')

// Akun non-warga ditandai dengan nama instansi (atau peran bila tidak punya instansi).
const roleLabel = computed(() =>
  author.value.role && author.value.role !== 'WARGA'
    ? author.value.agencyName || humanizeEnum(author.value.role)
    : '',
)

// Pelapor anonim yang disamarkan BE (id null) sudah bernama "Pelapor (anonim)", jadi tanpa lencana.
const reporterBadge = computed(() => {
  if (!author.value.isReporter || author.value.id === null) return ''
  return author.value.isAnonymous ? 'Pelapor (anonim)' : 'Pelapor'
})

const showKind = computed(() => props.comment.kind && props.comment.kind !== COMMENT_KIND.KOMENTAR)
const kindClass = computed(() =>
  props.comment.kind === COMMENT_KIND.SANGGAHAN ? 'bg-maroon text-white' : 'bg-lime/50',
)

// BE mengirim body null untuk komentar yang disembunyikan moderator (selain untuk admin).
const concealed = computed(() => props.comment.body === null)
const adminSeesHidden = computed(() => props.comment.isHidden && !concealed.value)
const media = computed(() => props.comment.media ?? [])
</script>

<template>
  <div class="flex gap-3">
    <img
      v-if="author.avatarUrl"
      :src="assetUrl(author.avatarUrl)"
      alt=""
      class="shrink-0 rounded-full bg-sand-dark object-cover"
      :class="compact ? 'size-7' : 'size-9'"
    />
    <span
      v-else
      class="grid shrink-0 place-items-center rounded-full bg-sand-dark font-bold"
      :class="compact ? 'size-7 text-xs' : 'size-9 text-sm'"
      aria-hidden="true"
    >{{ initial }}</span>

    <div class="min-w-0 flex-1">
      <p class="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
        <strong class="font-bold">{{ author.name }}</strong>
        <span v-if="reporterBadge" class="rounded-full bg-sand px-2 py-0.5 text-[10px] font-bold">{{ reporterBadge }}</span>
        <span v-if="roleLabel" class="rounded-full bg-lime/50 px-2 py-0.5 text-[10px] font-bold">{{ roleLabel }}</span>
        <span v-if="showKind" class="rounded-full px-2 py-0.5 text-[10px] font-bold" :class="kindClass">{{ COMMENT_KIND_LABEL[comment.kind] ?? humanizeEnum(comment.kind) }}</span>
        <span v-if="adminSeesHidden" class="rounded-full bg-sand px-2 py-0.5 text-[10px] font-bold" :title="comment.hiddenReason || undefined">Disembunyikan</span>
        <span class="text-xs text-maroon/60">{{ timeAgo(comment.createdAt) }}</span>
      </p>

      <p v-if="concealed" class="mt-0.5 flex items-center gap-1.5 text-sm italic text-maroon/60">
        <EyeOff class="size-4 shrink-0" aria-hidden="true" /> {{ comment.hiddenMessage }}
      </p>
      <p v-else class="mt-0.5 whitespace-pre-line break-words text-sm">{{ comment.body }}</p>

      <ul v-if="media.length" class="mt-2 flex flex-wrap gap-2">
        <li v-for="item in media" :key="item.id">
          <video
            v-if="item.type === 'VIDEO'"
            :src="assetUrl(item.url)"
            controls
            preload="metadata"
            class="h-40 max-w-full rounded-lg border border-sand-dark bg-black"
            aria-label="Video bukti komentar"
          ></video>
          <a v-else :href="assetUrl(item.url)" target="_blank" rel="noopener noreferrer">
            <img :src="assetUrl(item.url)" alt="Foto bukti komentar" class="size-20 rounded-lg border border-sand-dark object-cover" />
          </a>
        </li>
      </ul>

      <button
        v-if="canReply"
        type="button"
        class="mt-1 cursor-pointer text-xs font-bold text-maroon/70 hover:text-maroon"
        @click="emit('reply', comment)"
      >Balas</button>
    </div>
  </div>
</template>