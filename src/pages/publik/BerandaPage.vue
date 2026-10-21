<script setup>
import { ref } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'

// CONTOH PEMAKAIAN BaseModal:
// 1. buat satu ref boolean
// 2. pasang di v-model
// 3. ubah ref jadi true untuk membuka
const showModal = ref(false)

const konfirmasi = () => {
  showModal.value = false
}
</script>

<template>
  <section class="mx-auto w-full max-w-[1120px] px-4 py-8">
    <!-- Banner tes: hapus kalau Tailwind sudah terbukti aktif -->
    <div
      class="mb-6 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
    >
      Tailwind aktif ✅
    </div>

    <h1 class="text-3xl font-bold text-gray-900">Beranda</h1>
    <p class="mt-2 mb-6 text-gray-600">
      Halaman ini contoh pemakaian layout, navbar, dan modal.
    </p>

    <button
      type="button"
      class="cursor-pointer rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800"
      @click="showModal = true"
    >
      Buka modal
    </button>

    <BaseModal v-model="showModal" title="Konfirmasi">
      <p>Isi modal ditulis di sini. Bisa teks, form, atau komponen lain.</p>

      <!-- slot "footer" opsional, dipakai untuk tombol aksi -->
      <template #footer>
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-800 hover:bg-gray-100"
            @click="showModal = false"
          >
            Batal
          </button>
          <button
            type="button"
            class="cursor-pointer rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800"
            @click="konfirmasi"
          >
            Lanjutkan
          </button>
        </div>
      </template>
    </BaseModal>
  </section>
</template>