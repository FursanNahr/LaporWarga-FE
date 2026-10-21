<script setup>
import { watch, onBeforeUnmount } from 'vue'

/**
 * BaseModal: modal generik, tidak tahu apa-apa soal laporan.
 *
 * Props
 *  - modelValue : Boolean  -> buka/tutup (dipakai dengan v-model)
 *  - title      : String   -> judul modal (opsional)
 *
 * Slot
 *  - default    -> isi modal
 *  - footer     -> area tombol di bawah (opsional)
 */
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const close = () => emit('update:modelValue', false)

const onKeydown = (e) => e.key === 'Escape' && close()

watch(
  () => props.modelValue,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) window.addEventListener('keydown', onKeydown)
    else window.removeEventListener('keydown', onKeydown)
  }
)

// Bersihkan kalau komponen dihancurkan saat modal masih terbuka
onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <!-- Teleport memindahkan modal ke <body> supaya tidak terpotong oleh parent -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal__overlay" @click.self="close">
        <div class="modal__box" role="dialog" aria-modal="true" :aria-label="title || 'Dialog'">
          <header class="modal__header">
            <h3 class="modal__title">{{ title }}</h3>
            <button class="modal__close" type="button" aria-label="Tutup" @click="close">&times;</button>
          </header>

          <div class="modal__body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="modal__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal__overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.5);
}
.modal__box {
  width: 100%;
  max-width: 440px;
  max-height: 90vh;
  overflow-y: auto;
  background: var(--color-bg);
  border-radius: var(--radius);
  box-shadow: var(--shadow-modal);
}
.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
}
.modal__title { margin: 0; font-size: 1.125rem; }
.modal__close {
  background: none;
  border: 0;
  font-size: 1.5rem;
  line-height: 1;
  color: var(--color-text-muted);
  cursor: pointer;
}
.modal__body { padding: 1.25rem; }
.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--color-border);
}

/* Animasi buka/tutup */
.modal-enter-active,
.modal-leave-active { transition: opacity 0.15s ease; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active { transition: none; }
}
</style>