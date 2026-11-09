import { ref, watch } from 'vue'

/**
 * Muat data statistik dan muat ulang otomatis saat `params` berubah.
 *  - fetcher: fungsi dari statsApi, contoh statsApi.citizens
 *  - params: ref/computed berisi { range, dateFrom, dateTo }
 * Respons lama yang datang terlambat diabaikan, jadi filter yang diganti cepat tidak menimpa hasil terbaru.
 */
export function useStatsData(fetcher, params) {
  const data = ref(null)
  const loading = ref(true)
  const error = ref('')
  let latest = 0

  async function load() {
    const current = ++latest
    loading.value = true
    error.value = ''
    try {
      const { data: body } = await fetcher(params.value)
      if (current === latest) data.value = body.data
    } catch (e) {
      if (current === latest) error.value = e.normalized?.message ?? 'Gagal memuat statistik.'
    } finally {
      if (current === latest) loading.value = false
    }
  }

  watch(params, load, { deep: true, immediate: true })

  return { data, loading, error, reload: load }
}