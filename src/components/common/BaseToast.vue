<script setup>
import { useToast } from '@/composables/useToast'

/** BaseToast: penampil toast. Pasang satu kali di App.vue; pesan dikirim lewat useToast(). */
const { toasts, remove } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="toasts">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="`toast--${toast.type}`"
          :role="toast.type === 'error' ? 'alert' : 'status'"
        >
          <span class="toast__message">{{ toast.message }}</span>
          <button type="button" class="toast__close" aria-label="Tutup pesan" @click="remove(toast.id)">
            &times;
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toasts {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  left: 1rem;
  z-index: 1000;
  display: grid;
  justify-items: end;
  gap: 0.5rem;
  pointer-events: none; /* area kosong tidak menghalangi klik di bawahnya */
}
.toast {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  width: min(100%, 24rem);
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-left-width: 4px;
  border-radius: var(--radius);
  background: var(--color-bg);
  color: inherit;
  box-shadow: 0 4px 16px rgb(0 0 0 / 0.12);
  pointer-events: auto;
}
.toast--success { border-left-color: var(--color-success, #15803d); }
.toast--error { border-left-color: var(--color-danger, #b91c1c); }
.toast--info { border-left-color: var(--color-primary); }
.toast__message { flex: 1; }
.toast__close {
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-text-muted);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
}

.toast-enter-active,
.toast-leave-active { transition: opacity 0.2s, transform 0.2s; }
.toast-enter-from,
.toast-leave-to { opacity: 0; transform: translateY(0.5rem); }

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active { transition: none; }
}
</style>