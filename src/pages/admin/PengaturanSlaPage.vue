<script setup>
import { onMounted, reactive, ref } from 'vue'
import { Info, Play, RefreshCw } from 'lucide-vue-next'
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

const resultTiles = () => [
  { label: 'Laporan diperiksa', value: checkResult.value.checked, alert: false },
  { label: 'Baru melewati batas', value: checkResult.value.becameOverdue, alert: checkResult.value.becameOverdue > 0 },
  { label: 'Tidak lagi terlewat', value: checkResult.value.cleared, alert: false },
  { label: 'Penanda dibersihkan', value: checkResult.value.cleaned, alert: false },
]

const alertClass = 'rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800'
</script>

<template>
  <section class="mx-auto w-full max-w-[1400px] px-5 py-8 lg:px-8">
    <header>
      <h1 class="text-4xl font-extrabold tracking-tight text-maroon sm:text-5xl">
        <span class="relative inline-block">
          Pengaturan
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
        SLA
      </h1>
      <p class="mt-3 max-w-2xl text-lg text-maroon/80">
        Batas waktu (hari) untuk tiap tahap. Laporan yang melewati batas ditandai merah dan dieskalasi lewat notifikasi.
      </p>
    </header>

    <BaseLoading v-if="loading" class="mt-10" text="Memuat pengaturan..." />
    <p v-else-if="loadError" :class="[alertClass, 'mt-8']" role="alert">{{ loadError }}</p>

    <div v-else class="mt-8 max-w-3xl space-y-6">
      <!-- Form batas waktu -->
      <form class="rounded-2xl border border-sand-dark bg-sand p-5 sm:p-6" novalidate @submit.prevent="save">
        <div class="mb-5 flex items-center gap-2.5">
          <span class="size-3.5 rounded-full bg-lime" aria-hidden="true"></span>
          <h2 class="text-xl font-extrabold text-maroon">Batas waktu per tahap</h2>
        </div>

        <p v-if="formError" :class="[alertClass, 'mb-4']" role="alert">{{ formError }}</p>

        <ol class="space-y-3">
          <li v-for="(item, i) in stages" :key="item.stage" class="rounded-xl bg-white px-4 py-4">
            <div class="flex flex-wrap items-center gap-4">
              <span
                class="flex size-9 shrink-0 items-center justify-center rounded-full bg-lime text-sm font-extrabold text-maroon-dark"
                aria-hidden="true"
              >{{ i + 1 }}</span>

              <div class="min-w-0 flex-1 basis-48">
                <label :for="`sla-${item.stage}`" class="block font-bold leading-tight text-maroon">{{ item.label }}</label>
                <p class="mt-1 text-xs text-maroon/70">
                  <template v-if="item.isDefault">Belum pernah diubah (nilai bawaan).</template>
                  <template v-else>
                    Terakhir diubah {{ formatDateTime(item.updatedAt) }}<template v-if="item.updatedBy"> oleh {{ item.updatedBy.name }}</template>.
                  </template>
                </p>
              </div>

              <div class="flex items-center gap-2">
                <input
                  :id="`sla-${item.stage}`"
                  v-model.number="form[item.stage]"
                  class="h-11 w-24 rounded-full border bg-white px-4 text-center text-base font-extrabold text-maroon focus:outline-none focus:ring-2 focus:ring-lime"
                  :class="errors[item.stage] ? 'border-red-600' : 'border-maroon/25 focus:border-maroon'"
                  type="number"
                  inputmode="numeric"
                  :min="MIN_DAYS"
                  :max="MAX_DAYS"
                  step="1"
                  :aria-invalid="!!errors[item.stage]"
                />
                <span class="text-sm font-semibold text-maroon">hari</span>
              </div>
            </div>
            <span v-if="errors[item.stage]" class="mt-2 block text-xs font-medium text-red-700" role="alert">
              {{ errors[item.stage] }}
            </span>
          </li>
        </ol>

        <p class="mt-5 flex items-start gap-2.5 rounded-xl bg-white/60 px-4 py-3 text-sm leading-relaxed text-maroon/80">
          <Info class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Hitungan tiap tahap dimulai saat laporan pindah ke tahap itu. Catatan tambahan di tahap yang sama tidak
          mengulang hitungan.
        </p>

        <div class="mt-5 flex justify-end">
          <BaseButton type="submit" :loading="saving">Simpan</BaseButton>
        </div>
      </form>

      <!-- Pengecekan manual -->
      <section class="rounded-2xl bg-maroon p-5 text-white sm:p-6" aria-labelledby="h-check">
        <h2 id="h-check" class="text-xl font-extrabold">Pengecekan SLA</h2>
        <p class="mt-2 text-sm leading-relaxed text-white/80">
          Sistem memeriksa otomatis tiap 10 menit. Jalankan sekarang jika ingin melihat hasil perubahan batas waktu
          langsung. Saat laporan baru melewati batas, semua admin dan atasan instansi mendapat notifikasi.
        </p>

        <p v-if="checkError" :class="[alertClass, 'mt-4']" role="alert">{{ checkError }}</p>

        <button
          type="button"
          class="mt-5 inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-lime px-5 text-sm font-bold text-maroon-dark transition-colors hover:bg-lime-dark disabled:cursor-not-allowed disabled:opacity-70"
          :aria-busy="checking"
          :disabled="checking"
          @click="runCheck"
        >
          <RefreshCw v-if="checking" class="size-4 animate-spin" aria-hidden="true" />
          <Play v-else class="size-4" aria-hidden="true" />
          {{ checking ? 'Memeriksa...' : 'Jalankan pengecekan sekarang' }}
        </button>

        <dl v-if="checkResult" class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-live="polite">
          <div
            v-for="tile in resultTiles()"
            :key="tile.label"
            class="rounded-xl px-4 py-3"
            :class="tile.alert ? 'bg-red-600 text-white' : 'bg-white text-maroon'"
          >
            <dd class="text-2xl font-extrabold leading-none">{{ tile.value }}</dd>
            <dt class="mt-1.5 text-xs font-semibold opacity-75">{{ tile.label }}</dt>
          </div>
        </dl>
      </section>
    </div>
  </section>
</template>