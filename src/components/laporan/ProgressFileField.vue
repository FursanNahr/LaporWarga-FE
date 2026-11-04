<script setup>
import { computed, ref, useId } from 'vue'
import { Camera, FileText, ImagePlus, X } from 'lucide-vue-next'

/**
 * ProgressFileField: dropzone pengganti <input type="file"> bawaan browser.
 * - `items` = [{ id, file, previewUrl }] (state tetap dipegang ProgressUpdateForm).
 * - Emit `pick` dengan objek bergaya event ({ target: { files, value } }) supaya
 *   addFiles(group, event) di form tidak perlu diubah. Berlaku untuk klik maupun seret-lepas.
 * - Emit `remove` dengan id item.
 * - Kalau `capture` diisi (kamera), seret-lepas dimatikan.
 */
const props = defineProps({
  label: { type: String, required: true },
  hint: { type: String, default: '' },
  accept: { type: String, default: '' },
  multiple: { type: Boolean, default: false },
  capture: { type: String, default: undefined },
  items: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['pick', 'remove'])

const inputId = useId()
const hintId = `${inputId}-hint`
const dragging = ref(false)

const camera = computed(() => Boolean(props.capture))
const canDrop = computed(() => !camera.value && !props.disabled)

function onChange(event) {
  emit('pick', event)
}

function onDragOver() {
  if (canDrop.value) dragging.value = true
}

function onDrop(event) {
  dragging.value = false
  if (!canDrop.value) return
  const list = Array.from(event.dataTransfer?.files ?? [])
  if (list.length === 0) return
  emit('pick', { target: { files: props.multiple ? list : list.slice(0, 1), value: '' } })
}
</script>

<template>
  <div>
    <label :for="inputId" class="block text-sm font-bold">{{ label }}</label>
    <p v-if="hint" :id="hintId" class="mt-0.5 text-xs text-maroon/65">{{ hint }}</p>

    <div class="relative mt-2">
      <input
        :id="inputId"
        type="file"
        class="peer sr-only"
        :accept="accept"
        :multiple="multiple"
        :capture="capture"
        :disabled="disabled"
        :aria-describedby="hint ? hintId : undefined"
        @change="onChange"
      />
      <label
        :for="inputId"
        class="flex flex-col items-center gap-1 rounded-2xl border-2 border-dashed px-4 py-5 text-center transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-maroon"
        :class="[
          dragging ? 'border-maroon bg-lime/20' : 'border-sand-dark bg-white hover:border-maroon/50 hover:bg-sand/60',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        ]"
        @dragover.prevent="onDragOver"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <component :is="camera ? Camera : ImagePlus" class="size-6 text-maroon/80" aria-hidden="true" />
        <span class="text-sm font-bold">{{ camera ? 'Ambil foto dengan kamera' : 'Pilih berkas' }}</span>
        <span v-if="canDrop" class="text-xs text-maroon/60">atau seret dan lepas di sini</span>
      </label>
    </div>

    <ul v-if="items.length" class="mt-3 grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-3">
      <li v-for="item in items" :key="item.id" class="relative">
        <img
          v-if="item.previewUrl"
          :src="item.previewUrl"
          :alt="item.file.name"
          class="aspect-square w-full rounded-xl border border-sand-dark object-cover"
        />
        <div
          v-else
          class="grid aspect-square place-items-center gap-1 rounded-xl border border-sand-dark bg-sand p-2 text-center"
        >
          <FileText class="size-6" aria-hidden="true" />
          <span class="line-clamp-2 break-all text-[11px] font-semibold">{{ item.file.name }}</span>
        </div>
        <button
          type="button"
          class="absolute -right-2 -top-2 grid size-6 cursor-pointer place-items-center rounded-full bg-maroon text-white shadow transition-colors hover:bg-maroon-dark"
          :aria-label="`Hapus ${item.file.name}`"
          @click="emit('remove', item.id)"
        >
          <X class="size-3.5" aria-hidden="true" />
        </button>
      </li>
    </ul>
  </div>
</template>