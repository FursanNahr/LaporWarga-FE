<script setup>
import { reactive, ref } from 'vue'
import { ArrowRight, User, Mail, Lock } from 'lucide-vue-next'
import { useAuth } from '@/composables/useAuth'
import { validateRegister } from '@/utils/validators'
import { APP_NAME } from '@/constants/brand'
import AuthCard from '@/components/layout/AuthCard.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const { register } = useAuth()

const form = reactive({ name: '', email: '', password: '', confirmPassword: '' })
const errors = ref({})
const serverError = ref('')
const loading = ref(false)

async function onSubmit() {
  serverError.value = ''
  errors.value = validateRegister(form)
  if (Object.keys(errors.value).length) return

  loading.value = true
  try {
    // confirmPassword hanya untuk validasi di FE, tidak dikirim ke BE
    await register({ name: form.name.trim(), email: form.email.trim(), password: form.password })
  } catch (e) {
    const { message, fieldErrors } = e.normalized ?? {}
    if (fieldErrors && Object.keys(fieldErrors).length) errors.value = fieldErrors
    else serverError.value = message ?? 'Terjadi kesalahan' // mis. 409 "Email sudah terdaftar"
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthCard title="Daftar Akun" :subtitle="`Isi data berikut untuk membuat akun ${APP_NAME}`">
    <p v-if="serverError" class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">{{ serverError }}</p>

    <form novalidate class="space-y-4" @submit.prevent="onSubmit">
      <BaseInput
        v-model="form.name"
        label="Nama lengkap"
        hide-label
        placeholder="Nama Lengkap"
        autocomplete="name"
        :icon="User"
        :error="errors.name"
      />
      <BaseInput
        v-model="form.email"
        label="Email"
        hide-label
        placeholder="Email Aktif"
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
        autocomplete="new-password"
        :icon="Lock"
        :error="errors.password"
      />
      <BaseInput
        v-model="form.confirmPassword"
        label="Ulangi password"
        hide-label
        placeholder="Konfirmasi Password"
        type="password"
        autocomplete="new-password"
        :icon="Lock"
        :error="errors.confirmPassword"
      />
      <BaseButton type="submit" block :loading="loading">
        Daftar Akun <ArrowRight class="size-4" aria-hidden="true" />
      </BaseButton>
    </form>

    <p class="mt-6 text-center text-sm">
      Sudah punya akun?
      <RouterLink :to="{ name: 'masuk' }" class="font-bold underline underline-offset-2">Masuk di sini</RouterLink>
    </p>
  </AuthCard>
</template>
