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

// Link bergaya tombol (RouterLink tidak bisa memakai BaseButton yang berupa <button>)
const linkBase =
  'inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-bold transition-colors'
const linkPrimary = `${linkBase} bg-maroon text-white hover:bg-maroon-dark`
const linkSecondary = `${linkBase} border-2 border-maroon text-maroon hover:bg-maroon hover:text-white`

onMounted(loadCategories)
</script>

<template>
  <section class="mx-auto w-full max-w-3xl px-4 py-8 sm:px-8 sm:py-10">
    <header class="mb-8">
      <h1 class="text-2xl font-extrabold text-maroon sm:text-3xl">Buat Laporan</h1>
      <p class="mt-1.5 text-sm text-maroon/70">
        Laporkan masalah fasilitas publik di sekitarmu, lengkap dengan lokasi dan foto bukti.
      </p>
    </header>

    <BaseCard v-if="created">
      <div class="flex flex-col items-center gap-3 p-6 text-center sm:p-8">
        <h2 class="text-xl font-extrabold text-maroon">Laporan berhasil dikirim</h2>
        <p class="text-sm text-maroon/70">Kode laporanmu:</p>
        <p class="rounded-full bg-lime px-5 py-2 font-mono text-lg font-extrabold tracking-wide text-maroon">
          {{ created.trackingCode }}
        </p>
        <p class="max-w-md text-sm text-maroon/70">
          Laporan akan diperiksa admin lebih dulu sebelum tampil di halaman publik.
        </p>
        <div class="mt-2 flex flex-wrap justify-center gap-3">
          <RouterLink :class="linkPrimary" :to="{ name: 'detail-laporan', params: { id: created.id } }">
            Lihat laporan
          </RouterLink>
          <RouterLink :class="linkSecondary" :to="{ name: 'warga-laporan-saya' }">Laporan Saya</RouterLink>
          <BaseButton variant="secondary" @click="resetForm">Buat laporan lagi</BaseButton>
        </div>
      </div>
    </BaseCard>

    <template v-else>
      <BaseLoading v-if="loadingCategories" />

      <div v-else-if="categoriesError" class="space-y-4">
        <p class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
          {{ categoriesError }}
        </p>
        <BaseButton variant="secondary" @click="loadCategories">Coba lagi</BaseButton>
      </div>

      <template v-else>
        <p
          v-if="serverError"
          class="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          role="alert"
        >
          {{ serverError }}
        </p>
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