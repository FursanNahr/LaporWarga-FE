<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/**
 * ReportMiniMap: peta Leaflet mode baca saja untuk menampilkan titik laporan.
 * Tidak ada klik / geser pin (beda dengan LocationPicker). Peta tetap bisa digeser dan di-zoom.
 * Tinggi diatur pemanggil lewat class (mis. class="h-56").
 */
const props = defineProps({
  latitude: { type: [String, Number], required: true },
  longitude: { type: [String, Number], required: true },
})

const DEFAULT_CENTER = [-6.914744, 107.60981] // Bandung
const ZOOM = 16

// Pin yang sama dengan LocationPicker (maroon + titik lime), digambar inline.
const PIN_HTML = `
<svg width="40" height="40" viewBox="0 0 24 24" fill="#44242d" stroke="#fffbf7" stroke-width="1.25"
  stroke-linejoin="round" style="filter: drop-shadow(0 2px 3px rgba(47,24,32,.45))" aria-hidden="true">
  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
  <circle cx="12" cy="10" r="3" fill="#c1f52f" stroke="none"/>
</svg>`
const pinIcon = L.divIcon({ className: '', html: PIN_HTML, iconSize: [40, 40], iconAnchor: [20, 36] })

const mapEl = ref(null)
let map = null
let marker = null
let resizeObserver = null

function currentPosition() {
  const latitude = Number(props.latitude)
  const longitude = Number(props.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  return [latitude, longitude]
}

function sync() {
  if (!map) return
  const position = currentPosition()
  if (!position) return
  if (marker) {
    marker.setLatLng(position)
  } else {
    marker = L.marker(position, { icon: pinIcon, interactive: false, keyboard: false, alt: 'Lokasi laporan' }).addTo(map)
  }
  map.setView(position, ZOOM)
}

watch(() => [props.latitude, props.longitude], sync)

onMounted(() => {
  map = L.map(mapEl.value, {
    center: currentPosition() ?? DEFAULT_CENTER,
    zoom: ZOOM,
    scrollWheelZoom: false, // supaya scroll halaman tidak "tersangkut" di peta
  })

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map)

  map.on('focus', () => map.scrollWheelZoom.enable())
  map.on('blur', () => map.scrollWheelZoom.disable())

  sync()

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
  <!-- isolate: z-index internal Leaflet tidak menembus topbar / drawer sidebar -->
  <div class="relative isolate overflow-hidden rounded-2xl border border-sand-dark bg-sand">
    <div ref="mapEl" class="size-full" role="application" aria-label="Peta lokasi laporan"></div>
  </div>
</template>