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
  <section class="container page">
    <h1>Beranda</h1>
    <p>Halaman ini contoh pemakaian layout, navbar, dan modal.</p>

    <button class="btn btn-primary" type="button" @click="showModal = true">Buka modal</button>

    <BaseModal v-model="showModal" title="Konfirmasi">
      <p>Isi modal ditulis di sini. Bisa teks, form, atau komponen lain.</p>

      <!-- slot "footer" opsional, dipakai untuk tombol aksi -->
      <template #footer>
        <button class="btn" type="button" @click="showModal = false">Batal</button>
        <button class="btn btn-primary" type="button" @click="konfirmasi">Lanjutkan</button>
      </template>
    </BaseModal>
  </section>
</template>

<style scoped>
.page { padding-top: 2rem; padding-bottom: 2rem; }
</style>