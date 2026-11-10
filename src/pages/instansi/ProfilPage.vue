<script setup>
import { computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import BaseBadge from '@/components/common/BaseBadge.vue'
import ProfilInfo from '@/components/profil/ProfilInfo.vue'

// Profil petugas instansi: data berasal dari auth.store (GET /auth/me), termasuk agency & isAgencyHead.
const { user } = useAuth()

const extraRows = computed(() => [
  { label: 'Instansi', value: user.value?.agency?.name ?? '-' },
  { label: 'Jabatan', value: user.value?.isAgencyHead ? 'Kepala Instansi' : 'Petugas' },
])
</script>

<template>
  <ProfilInfo
    :user="user"
    :extra-rows="extraRows"
    subtitle="Informasi akun petugas dan instansi yang kamu wakili."
  >
    <template #badges>
      <BaseBadge v-if="user?.isAgencyHead" variant="success">Kepala Instansi</BaseBadge>
    </template>
  </ProfilInfo>
</template>