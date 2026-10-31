<script setup>
import { onMounted, reactive, ref } from 'vue'
import { adminApi } from '@/api/admin.api'
import { useToast } from '@/composables/useToast'
import { formatDateTime } from '@/utils/formatDate'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'

const MIN_DAYS = 1
const MAX_DAYS = 365 // cermin SLA.MAX_DAYS di BE

const toast = useToast()

const stages = ref([]) // [{ stage, label, maxDays, isDefault, updatedAt, updatedBy }]
const form = reactive({}) // stage -> jumlah hari
const loading = ref(true)
const loadError = ref('')

function fill(list) {
  stages.value = list
  for (const item of list) form[item.stage] = item.maxDays
}

onMounted(async () => {
  try {
    const { data: body } = await adminApi.sla()
    fill(body.data)
  } catch (e) {
    loadError.value = e.normalized?.message ?? 'Gagal memuat pengaturan SLA.'
  } finally {
    loading.value = false
  }
})

// ---- Simpan ----
const saving = ref(false)
const formError = ref('')
const errors = ref({})

async function save() {
  if (saving.value) return
  formError.value = ''
  errors.value = {}

  for (const { stage } of stages.value) {
    const days = form[stage]
    if (!Number.isInteger(days) || days < MIN_DAYS || days > MAX_DAYS) {
      errors.value[stage] = `Isi bilangan bulat ${MIN_DAYS} sampai ${MAX_DAYS}.`
    }
  }
  if (Object.keys(errors.value).length) return

  saving.value = true
  try {
    const { data: body } = await adminApi.simpanSla({
      settings: stages.value.map(({ stage }) => ({ stage, maxDays: form[stage] })),
    })
    fill(body.data)
    toast.success('Pengaturan SLA disimpan. Penanda terlewat diperbarui pada pengecekan berikutnya.')
  } catch (e) {
    formError.value = e.normalized?.message ?? 'Gagal menyimpan pengaturan SLA.'
  } finally {
    saving.value = false
  }
}

// ---- Pengecekan manual ----
const checking = ref(false)
const checkResult = ref(null)
const checkError = ref('')

async function runCheck() {
  if (checking.value) return
  checking.value = true
  checkError.value = ''
  try {
    const { data: body } = await adminApi.cekSla()
    checkResult.value = body.data
  } catch (e) {
    checkError.value = e.normalized?.message ?? 'Gagal menjalankan pengecekan SLA.'
  } finally {
    checking.value = false
  }
}
</script>

<template>
  <section class="container admin-page">
    <header class="page-header">
      <div>
        <h1>Pengaturan SLA</h1>
        <p>Batas waktu (hari) untuk tiap tahap. Laporan yang melewati batas ditandai merah dan dieskalasi lewat notifikasi.</p>
      </div>
    </header>

    <BaseLoading v-if="loading" text="Memuat pengaturan..." />
    <p v-else-if="loadError" class="alert alert--error" role="alert">{{ loadError }}</p>

    <template v-else>
      <form class="panel" novalidate @submit.prevent="save">
        <h2>Batas waktu per tahap</h2>
        <p v-if="formError" class="alert alert--error" role="alert">{{ formError }}</p>

        <div v-for="item in stages" :key="item.stage" class="field">
          <label :for="`sla-${item.stage}`">{{ item.label }}</label>
          <div class="row">
            <input
              :id="`sla-${item.stage}`"
              v-model.number="form[item.stage]"
              class="control days"
              type="number"
              inputmode="numeric"
              :min="MIN_DAYS"
              :max="MAX_DAYS"
              step="1"
              :aria-invalid="!!errors[item.stage]"
            />
            <span>hari</span>
          </div>
          <span v-if="errors[item.stage]" class="field__error" role="alert">{{ errors[item.stage] }}</span>
          <small class="hint">
            <template v-if="item.isDefault">Belum pernah diubah (nilai bawaan).</template>
            <template v-else>Terakhir diubah {{ formatDateTime(item.updatedAt) }}<template v-if="item.updatedBy"> oleh {{ item.updatedBy.name }}</template>.</template>
          </small>
        </div>

        <p class="hint">
          Hitungan tiap tahap dimulai saat laporan pindah ke tahap itu. Catatan tambahan di tahap yang sama tidak
          mengulang hitungan.
        </p>
        <BaseButton type="submit" :loading="saving">Simpan</BaseButton>
      </form>

      <section class="panel" aria-labelledby="h-check">
        <h2 id="h-check">Pengecekan SLA</h2>
        <p class="hint">
          Sistem memeriksa otomatis tiap 10 menit. Jalankan sekarang jika ingin melihat hasil perubahan batas waktu
          langsung. Saat laporan baru melewati batas, semua admin dan atasan instansi mendapat notifikasi.
        </p>
        <p v-if="checkError" class="alert alert--error" role="alert">{{ checkError }}</p>
        <button type="button" class="btn" :aria-busy="checking" @click="runCheck">
          {{ checking ? 'Memeriksa...' : 'Jalankan pengecekan sekarang' }}
        </button>

        <dl v-if="checkResult" class="facts result">
          <div><dt>Laporan diperiksa</dt><dd>{{ checkResult.checked }}</dd></div>
          <div><dt>Baru melewati batas</dt><dd>{{ checkResult.becameOverdue }}</dd></div>
          <div><dt>Tidak lagi terlewat</dt><dd>{{ checkResult.cleared }}</dd></div>
          <div><dt>Penanda dibersihkan</dt><dd>{{ checkResult.cleaned }}</dd></div>
        </dl>
      </section>
    </template>
  </section>
</template>

<style scoped>
.days { width: 7rem; }
.result { margin: 1rem 0 0; }
</style>