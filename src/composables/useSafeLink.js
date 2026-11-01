import { useRouter } from 'vue-router'

/**
 * Bikin link berdasarkan NAMA route, tapi tidak crash kalau nama route belum ada
 * atau param kurang (jatuh ke "/"). Cek console kalau link terasa salah arah.
 */
export function useSafeLink() {
  const router = useRouter()
  return (name, params) => {
    try {
      router.resolve({ name, params })
      return { name, params }
    } catch {
      if (import.meta.env.DEV) console.warn(`[useSafeLink] route "${name}" tidak ditemukan / param kurang`)
      return '/'
    }
  }
}
