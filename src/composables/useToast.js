import { readonly, ref } from 'vue'

// State di luar fungsi = dipakai bersama oleh semua pemanggil useToast().
// Penampilnya cukup satu: <BaseToast /> di App.vue.
const toasts = ref([])
let sequence = 0

const DEFAULT_DURATION_MS = 4000
const ERROR_DURATION_MS = 6000 // pesan error dibiarkan lebih lama supaya sempat dibaca

function remove(id) {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

function show(message, { type = 'info', duration } = {}) {
  const id = ++sequence
  toasts.value.push({ id, message, type })
  setTimeout(() => remove(id), duration ?? (type === 'error' ? ERROR_DURATION_MS : DEFAULT_DURATION_MS))
  return id
}

/**
 * Pemakaian:
 *   const toast = useToast()
 *   toast.success('Progres berhasil diperbarui.')
 *   toast.error(e.normalized?.message ?? 'Gagal memuat data.')
 */
export function useToast() {
  return {
    toasts: readonly(toasts),
    show,
    success: (message, options) => show(message, { ...options, type: 'success' }),
    error: (message, options) => show(message, { ...options, type: 'error' }),
    info: (message, options) => show(message, { ...options, type: 'info' }),
    remove,
  }
}