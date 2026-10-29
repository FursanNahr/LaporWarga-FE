import { computed, ref } from 'vue'

// Filter jarak dilakukan di server SETELAH satu halaman diambil, jadi sebuah halaman bisa kosong
// padahal masih ada data di halaman berikutnya. Kita lanjutkan mengambil beberapa kali.
const MAX_EMPTY_RETRY = 5

/**
 * Pagination berbasis cursor (sesuai BE): response { data: [...], meta: { limit, hasMore, nextCursor } }.
 *
 * @param fetcher  fungsi (params) => Promise<AxiosResponse>, mis. laporanApi.list
 * @param options  { limit }  jumlah item per halaman
 */
export function usePagination(fetcher, { limit = 12 } = {}) {
  const items = ref([])
  const meta = ref({ hasMore: false, nextCursor: null })
  const loading = ref(false) // muat pertama / saat filter berubah
  const loadingMore = ref(false) // "Muat lebih banyak"
  const error = ref('')
  const hasMore = computed(() => meta.value.hasMore)

  let currentParams = {}
  let requestId = 0 // respons milik request lama (filter berubah cepat) dibuang

  const fetchPage = async (extra = {}) => {
    const { data: body } = await fetcher({ ...currentParams, limit, ...extra })
    return body
  }

  /** Muat dari awal. Dipanggil saat halaman dibuka atau filter berubah. */
  async function load(params = currentParams) {
    currentParams = params
    const id = ++requestId
    loading.value = true
    loadingMore.value = false
    error.value = ''

    try {
      let body = await fetchPage()
      if (id !== requestId) return
      items.value = body.data
      meta.value = body.meta

      for (let i = 0; i < MAX_EMPTY_RETRY && items.value.length === 0 && meta.value.hasMore; i++) {
        body = await fetchPage({ cursor: meta.value.nextCursor })
        if (id !== requestId) return
        items.value = body.data
        meta.value = body.meta
      }
    } catch (e) {
      if (id !== requestId) return
      items.value = []
      meta.value = { hasMore: false, nextCursor: null }
      error.value = e.normalized?.message ?? 'Gagal memuat data'
    } finally {
      if (id === requestId) loading.value = false
    }
  }

  /** Tambahkan halaman berikutnya di bawah item yang sudah ada. */
  async function loadMore() {
    if (!meta.value.hasMore || loading.value || loadingMore.value) return
    const id = requestId
    loadingMore.value = true
    error.value = ''

    try {
      const body = await fetchPage({ cursor: meta.value.nextCursor })
      if (id !== requestId) return
      items.value.push(...body.data)
      meta.value = body.meta
    } catch (e) {
      if (id !== requestId) return
      error.value = e.normalized?.message ?? 'Gagal memuat data'
    } finally {
      if (id === requestId) loadingMore.value = false
    }
  }

  return { items, loading, loadingMore, error, hasMore, load, loadMore }
}