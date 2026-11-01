<script setup>
import { Globe } from 'lucide-vue-next'
import { useSafeLink } from '@/composables/useSafeLink'
import { APP_NAME } from '@/constants/brand'
import AppLogo from '@/components/layout/AppLogo.vue'

const link = useSafeLink()

const links = [
  { label: 'Beranda', name: 'beranda' },
  { label: 'Tentang', name: 'tentang' },
  { label: 'Bantuan', name: 'panduan-bantuan' },
  { label: 'Kebijakan Privasi', name: 'kebijakan-privasi' },
]
// Link sosial masih dummy. Isi href dengan akun asli nanti.
const socials = [
  { label: 'YouTube', href: '#' },
  { label: 'Instagram', href: '#' },
  { label: 'Situs web', href: '#' },
]
</script>

<template>
  <footer class="mt-16">
    <div class="mx-auto w-full max-w-[1120px] px-4">
      <div class="border-t border-maroon/50 py-10">
        <div class="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <RouterLink :to="link('beranda')" aria-label="Ke beranda"><AppLogo /></RouterLink>

          <ul class="flex flex-wrap items-center justify-center text-sm font-medium">
            <li v-for="(item, i) in links" :key="item.label" class="flex items-center">
              <RouterLink :to="link(item.name)" class="px-4 py-1 hover:underline">{{ item.label }}</RouterLink>
              <span v-if="i < links.length - 1" class="h-4 w-px bg-maroon" aria-hidden="true"></span>
            </li>
          </ul>

          <ul class="flex items-center gap-3">
            <li v-for="s in socials" :key="s.label">
              <a :href="s.href" :aria-label="s.label" class="flex size-9 items-center justify-center rounded-lg text-maroon transition-colors hover:bg-sand">
                <svg v-if="s.label === 'YouTube'" viewBox="0 0 24 24" class="size-7" aria-hidden="true">
                  <rect x="1.5" y="4.5" width="21" height="15" rx="4.5" fill="currentColor" />
                  <path d="M10 9l5 3-5 3z" fill="#fffbf7" />
                </svg>
                <svg v-else-if="s.label === 'Instagram'" viewBox="0 0 24 24" class="size-7" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
                </svg>
                <Globe v-else class="size-7" aria-hidden="true" />
              </a>
            </li>
          </ul>
        </div>
        <p class="mt-6 text-center text-xs text-maroon/60">&copy; {{ new Date().getFullYear() }} {{ APP_NAME }}</p>
      </div>
    </div>
  </footer>
</template>
