<script setup>
import { onMounted, ref } from 'vue'
import { laporanApi } from '@/api/laporan.api'
import { masterApi } from '@/api/master.api'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import LaporanForm from '@/components/laporan/LaporanForm.vue'

const categories = ref([])
const loadingCategories = ref(true)
const categoriesError = ref('')

const submitting = ref(false)
const serverError = ref('')
const fieldErrors = ref({})
const created = ref(null) // laporan yang baru dibuat (data dari BE)
const formKey = ref(0) // diubah untuk mengosongkan form (mount ulang)

async function loadCategories() {
  loadingCategories.value = true
  categoriesError.value = ''
  try {
    const { data: body } = await masterApi.categories()
    categories.value = body.data
  } catch (e) {
    categoriesError.value = e.normalized?.message ?? 'Gagal memuat daftar jenis laporan'
  } finally {
    loadingCategories.value = false
  }
}

async function onSubmit(formData) {
  serverError.value = ''
  fieldErrors.value = {}
  submitting.value = true

  try {
    const { data: body } = await laporanApi.create(formData)
    created.value = body.data
  } catch (e) {
    const { message, fieldErrors: fromServer } = e.normalized ?? {}
    if (fromServer && Object.keys(fromServer).length) fieldErrors.value = fromServer
    else serverError.value = message ?? 'Terjadi kesalahan'
  } finally {
    submitting.value = false
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function resetForm() {
  created.value = null
  formKey.value++
}

onMounted(loadCategories)
</script>

<template>
  <section class="container page">
    <h1>Buat Laporan</h1>

    <BaseCard v-if="created">
      <div class="success">
        <h2>Laporan berhasil dikirim</h2>
        <p>Kode laporanmu:</p>
        <p class="success__code">{{ created.trackingCode }}</p>
        <p>Laporan akan diperiksa admin lebih dulu sebelum tampil di halaman publik.</p>
        <div class="success__actions">
          <RouterLink class="btn btn-primary" :to="{ name: 'detail-laporan', params: { id: created.id } }">
            Lihat laporan
          </RouterLink>
          <RouterLink class="btn" :to="{ name: 'warga-laporan-saya' }">Laporan Saya</RouterLink>
          <button class="btn" type="button" @click="resetForm">Buat laporan lagi</button>
        </div>
      </div>
    </BaseCard>

    <template v-else>
      <BaseLoading v-if="loadingCategories" />

      <template v-else-if="categoriesError">
        <p class="form-alert" role="alert">{{ categoriesError }}</p>
        <BaseButton variant="secondary" @click="loadCategories">Coba lagi</BaseButton>
      </template>

      <template v-else>
        <p v-if="serverError" class="form-alert" role="alert">{{ serverError }}</p>
        <LaporanForm
          :key="formKey"
          :categories="categories"
          :loading="submitting"
          :errors="fieldErrors"
          @submit="onSubmit"
        />
      </template>
    </template>
  </section>
</template>

<style scoped>
.page { padding-top: 2rem; padding-bottom: 2rem; max-width: 720px; }
.success { padding: 1.5rem; }
.success h2 { margin-top: 0; }
.success__code {
  margin: 0 0 1rem;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--color-primary);
}
.success__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
</style>