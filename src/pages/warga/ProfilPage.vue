<script setup>
import { useAuth } from '@/composables/useAuth'
import ProfilInfo from '@/components/profil/ProfilInfo.vue'

// Profil warga: semua data berasal dari auth.store (GET /auth/me).
const { user } = useAuth()
</script>

<template>
  <ProfilInfo :user="user" subtitle="Informasi akun yang kamu pakai untuk melapor di LaporWarga." />
</template>