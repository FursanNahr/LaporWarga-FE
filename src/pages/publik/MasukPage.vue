<script setup>
import { reactive, ref } from 'vue'
import { ArrowRight, Mail, Lock } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'
import { validateLogin } from '@/utils/validators'
import { APP_NAME } from '@/constants/brand'
import AuthCard from '@/components/layout/AuthCard.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const { login } = useAuth()

const form = reactive({ email: '', password: '' })
const errors = ref({})
const serverError = ref('')
const loading = ref(false)

async function onSubmit() {
  serverError.value = ''
  errors.value = validateLogin(form)
  if (Object.keys(errors.value).length) return

  loading.value = true
  try {
    await login({ email: form.email.trim(), password: form.password })
  } catch (e) {
    const { message, fieldErrors } = e.normalized ?? {}
    if (fieldErrors && Object.keys(fieldErrors).length) errors.value = fieldErrors
    else serverError.value = message ?? 'Terjadi kesalahan'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthCard :title="`Masuk ke ${APP_NAME}`" subtitle="Akses akun Anda untuk melanjutkan">
    <p v-if="serverError" class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">{{ serverError }}</p>

    <form novalidate class="space-y-4" @submit.prevent="onSubmit">
      <BaseInput
        v-model="form.email"
        label="Email"
        hide-label
        placeholder="Email"
        type="email"
        autocomplete="email"
        :icon="Mail"
        :error="errors.email"
      />
      <BaseInput
        v-model="form.password"
        label="Password"
        hide-label
        placeholder="Password"
        type="password"
        autocomplete="current-password"
        :icon="Lock"
        :error="errors.password"
      />
      <BaseButton type="submit" block :loading="loading">
        Masuk <ArrowRight class="size-4" aria-hidden="true" />
      </BaseButton>
    </form>

    <p class="mt-6 text-center text-sm">
      Belum punya akun?
      <RouterLink :to="{ name: 'daftar' }" class="font-bold underline underline-offset-2">Daftar di sini</RouterLink>
    </p>
  </AuthCard>
</template>
