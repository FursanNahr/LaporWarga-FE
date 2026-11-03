<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { MapPin } from 'lucide-vue-next'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/**
 * LocationPicker: peta Leaflet untuk memilih titik lokasi kejadian.
 * - Klik peta atau geser pin -> emit `pick` { latitude, longitude } (number, 6 desimal).
 * - Kalau latitude/longitude dari luar berubah (tombol "Gunakan lokasi saya" atau
 *   diketik manual), pin ikut pindah dan peta mengikuti.
 *
 * Tinggi komponen diatur dari pemanggil lewat class (mis. class="h-64").
 */
const props = defineProps({
  latitude: { type: [String, Number], default: '' },
  longitude: { type: [String, Number], default: '' },
})
const emit = defineEmits(['pick'])

const DEFAULT_CENTER = [-6.914744, 107.60981] // Bandung
const DEFAULT_ZOOM = 13
const PIN_ZOOM = 16

// Pin sesuai moodboard (maroon + titik lime), digambar inline supaya tidak
// bergantung pada gambar marker bawaan Leaflet (sering rusak di Vite).
const PIN_HTML = `
<svg width="44" height="44" viewBox="0 0 24 24" fill="#44242d" stroke="#fffbf7" stroke-width="1.25"
  stroke-linejoin="round" style="filter: drop-shadow(0 2px 3px rgba(47,24,32,.45))" aria-hidden="true">
  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
  <circle cx="12" cy="10" r="3" fill="#c1f52f" stroke="none"/>
</svg>`
const pinIcon = L.divIcon({ className: '', html: PIN_HTML, iconSize: [44, 44], iconAnchor: [22, 40] })

const mapEl = ref(null)
const hasPosition = ref(false)

let map = null
let marker = null
let resizeObserver = null

const round6 = (n) => Number(n.toFixed(6))

// "" / teks setengah jadi / di luar rentang -> null
function toPosition(lat, lng) {
  if (String(lat).trim() === '' || String(lng).trim() === '') return null
  const latitude = Number(lat)
  const longitude = Number(lng)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null
  return [latitude, longitude]
}

function placeMarker(position) {
  if (marker) {
    marker.setLatLng(position)
  } else {
    marker = L.marker(position, { icon: pinIcon, draggable: true, keyboard: false, alt: 'Pin lokasi kejadian' }).addTo(map)
    marker.on('dragend', () => pick(marker.getLatLng()))
  }
  hasPosition.value = true
}

// Dipanggil saat user klik peta / selesai menggeser pin.
function pick(latlng) {
  const { lat, lng } = latlng.wrap() // peta bisa digeser mengelilingi dunia
  const position = [round6(lat), round6(lng)]
  placeMarker(position)
  emit('pick', { latitude: position[0], longitude: position[1] })
}

// Nilai dari luar (input / tombol lokasi saya) -> pin dan peta mengikuti.
function syncFromProps() {
  if (!map) return
  const position = toPosition(props.latitude, props.longitude)

  if (!position) {
    // Dikosongkan -> hapus pin. Teks setengah jadi ("-6.") dibiarkan, pin tetap di posisi terakhir.
    if (marker && String(props.latitude).trim() === '' && String(props.longitude).trim() === '') {
      marker.remove()
      marker = null
      hasPosition.value = false
    }
    return
  }

  const current = marker?.getLatLng()
  if (current && current.lat === position[0] && current.lng === position[1]) return // berasal dari klik sendiri

  placeMarker(position)
  map.setView(position, Math.max(map.getZoom(), PIN_ZOOM))
}

watch(() => [props.latitude, props.longitude], syncFromProps)

onMounted(() => {
  const initial = toPosition(props.latitude, props.longitude)

  map = L.map(mapEl.value, {
    center: initial ?? DEFAULT_CENTER,
    zoom: initial ? PIN_ZOOM : DEFAULT_ZOOM,
    scrollWheelZoom: false, // supaya scroll halaman tidak "tersangkut" di peta
  })

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map)

  // Scroll-zoom baru aktif setelah peta diklik/difokuskan.
  map.on('focus', () => map.scrollWheelZoom.enable())
  map.on('blur', () => map.scrollWheelZoom.disable())
  map.on('click', (event) => pick(event.latlng))

  if (initial) placeMarker(initial)

  // Ukuran kontainer bisa berubah (layout responsif, drawer sidebar) -> hitung ulang.
  resizeObserver = new ResizeObserver(() => map?.invalidateSize())
  resizeObserver.observe(mapEl.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  map?.remove()
  map = null
  marker = null
})
</script>

<template>
  <!-- isolate: z-index internal Leaflet (hingga 1000) tidak menembus topbar / drawer sidebar -->
  <div class="relative isolate overflow-hidden rounded-2xl border border-maroon/25 bg-sand">
    <div ref="mapEl" class="size-full" role="application" aria-label="Peta untuk memilih lokasi kejadian"></div>

    <div
      v-if="!hasPosition"
      class="pointer-events-none absolute left-3 top-3 z-[1000] flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-maroon shadow-sm"
    >
      <MapPin class="size-4" aria-hidden="true" />
      Pilih lokasi di peta
    </div>
  </div>
</template>