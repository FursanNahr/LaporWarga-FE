<script setup>
import { reactive, ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { validateRegister } from '@/utils/validators'
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
  <section class="container page">
    <h1>Daftar</h1>

    <p v-if="serverError" class="form-alert" role="alert">{{ serverError }}</p>

    <form novalidate @submit.prevent="onSubmit">
      <BaseInput v-model="form.name" label="Nama lengkap" autocomplete="name" :error="errors.name" />
      <BaseInput v-model="form.email" label="Email" type="email" autocomplete="email" :error="errors.email" />
      <BaseInput
        v-model="form.password"
        label="Password"
        type="password"
        autocomplete="new-password"
        :error="errors.password"
      />
      <BaseInput
        v-model="form.confirmPassword"
        label="Ulangi password"
        type="password"
        autocomplete="new-password"
        :error="errors.confirmPassword"
      />
      <BaseButton type="submit" :loading="loading">Daftar</BaseButton>
    </form>

    <p>Sudah punya akun? <RouterLink :to="{ name: 'masuk' }">Masuk</RouterLink></p>
  </section>
</template>

<style scoped>
.page { padding-top: 2rem; padding-bottom: 2rem; max-width: 420px; }
</style>