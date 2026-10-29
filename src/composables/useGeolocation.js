import { ref } from 'vue'

const ERROR_MESSAGES = {
  1: 'Izin lokasi ditolak. Aktifkan izin lokasi di pengaturan browser.',
  2: 'Lokasi perangkat tidak tersedia saat ini.',
  3: 'Waktu habis saat mencari lokasi. Coba lagi.',
}

/**
 * Ambil lokasi perangkat lewat browser (hanya jalan di HTTPS atau localhost).
 * locate() mengembalikan { latitude, longitude }, atau null kalau gagal (pesan ada di `error`).
 */
export function useGeolocation() {
  const coords = ref(null)
  const loading = ref(false)
  const error = ref('')

  function locate() {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        error.value = 'Browser ini tidak mendukung geolokasi.'
        resolve(null)
        return
      }

      loading.value = true
      error.value = ''

      navigator.geolocation.getCurrentPosition(
        (position) => {
          coords.value = { latitude: position.coords.latitude, longitude: position.coords.longitude }
          loading.value = false
          resolve(coords.value)
        },
        (err) => {
          error.value = ERROR_MESSAGES[err.code] ?? 'Gagal mengambil lokasi.'
          loading.value = false
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 10000 },
      )
    })
  }

  return { coords, loading, error, locate }
}