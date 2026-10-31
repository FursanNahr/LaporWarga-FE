import { computed, onBeforeUnmount, onMounted, reactive, watch } from 'vue'
import { usePagination } from '@/composables/usePagination'

const DEBOUNCE_MS = 400

/**
 * Daftar berpagination + filter: dipakai halaman admin yang bentuknya sama
 * (kata kunci, dropdown, tanggal). Memuat saat halaman dibuka dan setiap filter berubah.
 *
 *   const { filters, items, loading, hasMore, loadMore, reset, hasFilter } =
 *     useFilteredList(adminApi.listLaporan, { initial: { q: '', status: '' } })
 *
 * - `initial` = semua kunci filter beserta nilai awalnya (kunci wajib ada di sini).
 * - `resetTo` = nilai saat "Atur ulang" ditekan (bawaan: sama dengan `initial`). Beda dari `initial`
 *   kalau halaman dibuka dengan filter dari link, mis. dashboard -> ?isOverdue=true.
 * - `debounced` = kunci yang menunggu user berhenti mengetik (bawaan: q).
 * - Nilai kosong ('' / false / null) tidak dikirim, dan kata kunci < 2 karakter ditahan
 *   (BE menolaknya).
 */
export function useFilteredList(fetcher, { initial = {}, resetTo = initial, limit = 12, debounced = ['q'] } = {}) {
  const filters = reactive({ ...initial })
  const list = usePagination(fetcher, { limit })

  // Ubah nilai filter menjadi parameter request: buang yang kosong dan kata kunci yang terlalu pendek.
  const toParams = (source) => {
    const result = {}
    for (const [key, raw] of Object.entries(source)) {
      const value = typeof raw === 'string' ? raw.trim() : raw
      if (value === '' || value === null || value === undefined || value === false) continue
      if (key === 'q' && value.length < 2) continue
      result[key] = value
    }
    return result
  }

  const params = computed(() => toParams(filters))
  const baseKey = JSON.stringify(toParams(resetTo)) // "tanpa filter" = kondisi setelah Atur ulang
  const hasFilter = computed(() => JSON.stringify(params.value) !== baseKey)
  const keywordTooShort = computed(() => {
    const length = String(filters.q ?? '').trim().length
    return length > 0 && length < 2
  })

  let lastKey = '' // jangan muat ulang kalau parameternya sama
  let timer

  function apply() {
    const key = JSON.stringify(params.value)
    if (key === lastKey) return
    lastKey = key
    list.load(params.value)
  }

  /** Muat ulang dari awal dengan filter saat ini. */
  function reload() {
    lastKey = JSON.stringify(params.value)
    list.load(params.value)
  }

  function reset() {
    clearTimeout(timer)
    Object.assign(filters, resetTo)
    apply()
  }

  const immediateKeys = Object.keys(initial).filter((key) => !debounced.includes(key))
  watch(
    () => debounced.map((key) => filters[key]),
    () => {
      clearTimeout(timer)
      timer = setTimeout(apply, DEBOUNCE_MS)
    },
  )
  watch(() => immediateKeys.map((key) => filters[key]), apply)

  onMounted(reload)
  onBeforeUnmount(() => clearTimeout(timer))

  return { filters, params, hasFilter, keywordTooShort, reset, reload, ...list }
}