<script setup>
import { computed, ref, watch } from 'vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import { formatDate } from '@/utils/formatDate'
import { mediaUrl } from '@/utils/media'

/**
 * ProfilInfo: tampilan profil (read-only) yang dipakai halaman profil warga dan instansi.
 * Data diambil dari `user` (hasil GET /auth/me di auth.store).
 *
 * - `extraRows`: baris tambahan khusus role, mis. [{ label: 'Instansi', value: 'Dishub' }]
 * - slot `badges`: badge tambahan di samping badge role, mis. "Kepala Instansi"
 */
const props = defineProps({
  user: { type: Object, default: null },
  subtitle: { type: String, default: 'Informasi akun yang kamu gunakan di LaporWarga.' },
  extraRows: { type: Array, default: () => [] },
})

const ROLE_LABEL = { WARGA: 'Warga', INSTANSI: 'Petugas Instansi', ADMIN: 'Admin' }
const ROLE_VARIANT = { WARGA: 'primary', INSTANSI: 'info', ADMIN: 'warning' }

const roleLabel = computed(() => ROLE_LABEL[props.user?.role] ?? '-')
const roleVariant = computed(() => ROLE_VARIANT[props.user?.role] ?? 'neutral')

// Dua huruf awal nama, dipakai kalau belum ada avatar atau gambarnya gagal dimuat.
const initials = computed(() =>
  (props.user?.name ?? '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('') || '?',
)

const avatarBroken = ref(false)
watch(() => props.user?.avatarUrl, () => (avatarBroken.value = false))
const avatarSrc = computed(() => (avatarBroken.value ? '' : mediaUrl(props.user?.avatarUrl)))

const rows = computed(() => [
  { label: 'Nama lengkap', value: props.user?.name || '-' },
  { label: 'Email', value: props.user?.email || '-' },
  ...props.extraRows,
  { label: 'Bergabung sejak', value: formatDate(props.user?.createdAt) },
])
</script>

<template>
  <section class="mx-auto w-full max-w-[1400px] px-5 py-8 lg:px-8">
    <header>
      <h1 class="text-4xl font-extrabold tracking-tight text-maroon sm:text-5xl">
        <span class="relative inline-block">
          Profil
          <svg
            class="absolute -bottom-1.5 left-0 h-2.5 w-full"
            viewBox="0 0 200 12"
            preserveAspectRatio="none"
            fill="none"
            aria-hidden="true"
          >
            <path d="M2 8C45 2 120 2 198 7" stroke="#c1f52f" stroke-width="4" stroke-linecap="round" />
          </svg>
        </span>
        Saya
      </h1>
      <p class="mt-3 text-lg text-maroon/80">{{ subtitle }}</p>
    </header>

    <BaseCard v-if="user" class="mt-8 max-w-3xl p-6 sm:p-8">
      <div class="flex flex-wrap items-center gap-5">
        <img
          v-if="avatarSrc"
          :src="avatarSrc"
          :alt="`Foto profil ${user.name}`"
          class="size-24 shrink-0 rounded-full border border-sand-dark object-cover"
          @error="avatarBroken = true"
        />
        <div
          v-else
          class="grid size-24 shrink-0 place-items-center rounded-full bg-lime text-3xl font-extrabold text-maroon-dark"
          aria-hidden="true"
        >
          {{ initials }}
        </div>

        <div class="min-w-0">
          <h2 class="break-words text-2xl font-extrabold text-maroon">{{ user.name }}</h2>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <BaseBadge :variant="roleVariant">{{ roleLabel }}</BaseBadge>
            <slot name="badges" />
          </div>
        </div>
      </div>

      <dl class="mt-8 grid gap-4 sm:grid-cols-2">
        <div
          v-for="row in rows"
          :key="row.label"
          class="rounded-2xl border border-sand-dark bg-sand px-5 py-4"
        >
          <dt class="text-sm font-semibold text-maroon/70">{{ row.label }}</dt>
          <dd class="mt-1 break-words text-lg font-bold text-maroon">{{ row.value }}</dd>
        </div>
      </dl>
    </BaseCard>
  </section>
</template>
