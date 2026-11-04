<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, X } from 'lucide-vue-next'
import { assetUrl } from '@/api'

/**
 * PhotoGallery: grid foto (maks. 4 kotak) + lightbox.
 * `photos` = [{ id, url }]. Kalau lebih dari 4 foto, kotak ke-4 jadi "+N Foto lainnya".
 * Lightbox: tombol panah / Esc / klik latar untuk menutup. Induk bisa membukanya lewat
 * ref: gallery.value.open(index).
 */
const props = defineProps({
  photos: { type: Array, default: () => [] },
  alt: { type: String, default: 'Foto laporan' },
})

const MAX_TILES = 4

const tiles = computed(() =>
  props.photos.length > MAX_TILES ? props.photos.slice(0, MAX_TILES - 1) : props.photos,
)
const hiddenCount = computed(() => props.photos.length - tiles.value.length)

// ---- Lightbox --------------------------------------------------------------
const openIndex = ref(null)
const closeButton = ref(null)
const current = computed(() => (openIndex.value === null ? null : (props.photos[openIndex.value] ?? null)))
let lastFocused = null

function open(index) {
  if (!props.photos[index]) return
  lastFocused = document.activeElement
  openIndex.value = index
}
function close() {
  openIndex.value = null
}
function step(delta) {
  const total = props.photos.length
  if (total < 2 || openIndex.value === null) return
  openIndex.value = (openIndex.value + delta + total) % total
}
function onKeydown(event) {
  if (event.key === 'Escape') close()
  else if (event.key === 'ArrowLeft') step(-1)
  else if (event.key === 'ArrowRight') step(1)
}

watch(current, async (value, previous) => {
  if (value && !previous) {
    window.addEventListener('keydown', onKeydown)
    document.body.style.overflow = 'hidden'
    await nextTick()
    closeButton.value?.focus()
  } else if (!value && previous) {
    window.removeEventListener('keydown', onKeydown)
    document.body.style.overflow = ''
    lastFocused?.focus?.()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})

defineExpose({ open })
</script>

<template>
  <div>
    <ul class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <li v-for="(photo, index) in tiles" :key="photo.id ?? index">
        <button
          type="button"
          class="block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-xl border border-sand-dark bg-sand"
          :aria-label="`Perbesar foto ${index + 1} dari ${photos.length}`"
          @click="open(index)"
        >
          <img
            :src="assetUrl(photo.url)"
            :alt="`${alt} ${index + 1}`"
            loading="lazy"
            class="size-full object-cover transition-transform duration-200 hover:scale-105"
          />
        </button>
      </li>

      <li v-if="hiddenCount > 0">
        <button
          type="button"
          class="flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border border-sand-dark bg-sand transition-colors hover:bg-sand-dark/60"
          :aria-label="`Lihat ${hiddenCount} foto lainnya`"
          @click="open(tiles.length)"
        >
          <span class="text-xl font-extrabold">+{{ hiddenCount }}</span>
          <span class="text-xs font-medium text-maroon/70">Foto lainnya</span>
        </button>
      </li>
    </ul>

    <Teleport to="body">
      <div
        v-if="current"
        class="fixed inset-0 z-[2000] flex items-center justify-center bg-maroon-dark/90 p-4"
        role="dialog"
        aria-modal="true"
        :aria-label="alt"
        @click.self="close"
      >
        <button
          ref="closeButton"
          type="button"
          class="absolute right-4 top-4 grid size-11 cursor-pointer place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
          aria-label="Tutup"
          @click="close"
        >
          <X class="size-5" aria-hidden="true" />
        </button>

        <button
          v-if="photos.length > 1"
          type="button"
          class="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 sm:left-6"
          aria-label="Foto sebelumnya"
          @click="step(-1)"
        >
          <ChevronLeft class="size-6" aria-hidden="true" />
        </button>

        <img
          :key="openIndex"
          :src="assetUrl(current.url)"
          :alt="`${alt} ${openIndex + 1}`"
          class="max-h-[85vh] max-w-full rounded-xl object-contain"
        />

        <button
          v-if="photos.length > 1"
          type="button"
          class="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 sm:right-6"
          aria-label="Foto berikutnya"
          @click="step(1)"
        >
          <ChevronRight class="size-6" aria-hidden="true" />
        </button>

        <p
          class="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white"
          aria-live="polite"
        >
          {{ openIndex + 1 }} / {{ photos.length }}
        </p>
      </div>
    </Teleport>
  </div>
</template>