<script setup>
import { reactive, ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { validateLogin } from '@/utils/validators'
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
  <section class="container page">
    <h1>Masuk</h1>

    <p v-if="serverError" class="form-alert" role="alert">{{ serverError }}</p>

    <form novalidate @submit.prevent="onSubmit">
      <BaseInput v-model="form.email" label="Email" type="email" autocomplete="email" :error="errors.email" />
      <BaseInput
        v-model="form.password"
        label="Password"
        type="password"
        autocomplete="current-password"
        :error="errors.password"
      />
      <BaseButton type="submit" :loading="loading">Masuk</BaseButton>
    </form>

    <p>Belum punya akun? <RouterLink :to="{ name: 'daftar' }">Daftar</RouterLink></p>
  </section>
</template>

<style scoped>
.page { padding-top: 2rem; padding-bottom: 2rem; max-width: 420px; }
</style>