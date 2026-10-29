<script setup>
import BaseToast from '@/components/common/BaseToast.vue'
</script>

<template>
  <!-- App.vue sengaja tipis. Layout & halaman diatur oleh router. -->
  <RouterView />
  <!-- Penampil toast global; pesan dikirim lewat useToast() -->
  <BaseToast />
</template>