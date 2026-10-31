<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { adminApi } from '@/api/admin.api'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseEmptyState from '@/components/common/BaseEmptyState.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseTable from '@/components/common/BaseTable.vue'

/** AgencySection: daftar instansi, tambah, ubah, dan aktif/nonaktifkan. */
const toast = useToast()

const agencies = ref([])
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data: body } = await adminApi.listInstansi()
    agencies.value = body.data
  } catch (e) {
    error.value = e.normalized?.message ?? 'Gagal memuat instansi.'
  } finally {
    loading.value = false
  }
}
onMounted(load)

// Jumlah instansi kecil, jadi pencarian dilakukan di browser.
const keyword = ref('')
const rows = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  return q ? agencies.value.filter((agency) => agency.name.toLowerCase().includes(q)) : agencies.value
})

const columns = [
  { key: 'name', label: 'Instansi' },
  { key: 'staff', label: 'Petugas', align: 'right' },
  { key: 'subcategories', label: 'Subjenis', align: 'right' },
  { key: 'reports', label: 'Laporan', align: 'right' },
  { key: 'isActive', label: 'Status' },
]

// ---- Form tambah / ubah ----
const formOpen = ref(false)
const form = reactive({ id: null, name: '', description: '' })
const saving = ref(false)
const formError = ref('')
const fieldErrors = ref({})

function openForm(agency = null) {
  form.id = agency?.id ?? null
  form.name = agency?.name ?? ''
  form.description = agency?.description ?? ''
  formError.value = ''
  fieldErrors.value = {}
  formOpen.value = true
}

async function save() {
  if (saving.value) return
  formError.value = ''
  fieldErrors.value = {}
  if (form.name.trim().length < 3) {
    fieldErrors.value = { name: 'Nama instansi minimal 3 karakter.' }
    return
  }

  saving.value = true
  try {
    const description = form.description.trim()
    if (form.id) {
      await adminApi.ubahInstansi(form.id, { name: form.name.trim(), description: description || null })
    } else {
      await adminApi.buatInstansi({ name: form.name.trim(), description: description || undefined })
    }
    formOpen.value = false
    toast.success(form.id ? 'Instansi diperbarui.' : 'Instansi ditambahkan.')
    await load()
  } catch (e) {
    formError.value = e.normalized?.message ?? 'Gagal menyimpan instansi.'
    fieldErrors.value = e.normalized?.fieldErrors ?? {}
  } finally {
    saving.value = false
  }
}

// ---- Aktif / nonaktif ----
const toggleTarget = ref(null)
const toggleOpen = ref(false)
const toggling = ref(false)
const toggleError = ref('')

async function setActive(agency, isActive) {
  toggling.value = true
  toggleError.value = ''
  try {
    await adminApi.ubahInstansi(agency.id, { isActive })
    toggleOpen.value = false
    toast.success(isActive ? 'Instansi diaktifkan.' : 'Instansi dinonaktifkan.')
    await load()
  } catch (e) {
    const message = e.normalized?.message ?? 'Gagal mengubah status instansi.'
    if (toggleOpen.value) toggleError.value = message
    else toast.error(message)
  } finally {
    toggling.value = false
  }
}

function askToggle(agency) {
  if (!agency.isActive) return setActive(agency, true) // mengaktifkan tidak perlu konfirmasi
  toggleTarget.value = agency
  toggleError.value = ''
  toggleOpen.value = true
}
</script>

<template>
  <div>
    <div class="filters">
      <div class="filters__field filters__field--grow">
        <label for="agency-q">Cari instansi</label>
        <input id="agency-q" v-model="keyword" class="control" type="search" placeholder="Nama instansi" />
      </div>
      <button type="button" class="btn btn-primary" @click="openForm()">Tambah instansi</button>
    </div>

    <p v-if="error" class="alert alert--error" role="alert">{{ error }}</p>
    <BaseLoading v-if="loading && !agencies.length" text="Memuat instansi..." />
    <BaseEmptyState v-else-if="!rows.length && !error" title="Tidak ada instansi" description="Tambahkan instansi pertama, atau ubah kata kunci pencarian." />

    <BaseTable v-else :columns="columns" :rows="rows" actions-label="Aksi" caption="Daftar instansi">
      <template #cell-name="{ row }">
        <strong>{{ row.name }}</strong>
        <span v-if="row.description" class="clamp muted">{{ row.description }}</span>
      </template>
      <template #cell-staff="{ row }">{{ row.counts.staff }}</template>
      <template #cell-subcategories="{ row }">{{ row.counts.subcategories }}</template>
      <template #cell-reports="{ row }">{{ row.counts.reports }}</template>
      <template #cell-isActive="{ value }">
        <span class="tag" :class="value ? 'tag--ok' : ''">{{ value ? 'Aktif' : 'Nonaktif' }}</span>
      </template>
      <template #actions="{ row }">
        <button type="button" class="btn btn--sm" @click="openForm(row)">Ubah</button>
        <button type="button" class="btn btn--sm" :class="{ 'btn--danger': row.isActive }" @click="askToggle(row)">
          {{ row.isActive ? 'Nonaktifkan' : 'Aktifkan' }}
        </button>
      </template>
    </BaseTable>

    <BaseModal v-model="formOpen" :title="form.id ? 'Ubah instansi' : 'Tambah instansi'">
      <form class="admin-page admin-modal" novalidate @submit.prevent="save">
        <p v-if="formError" class="alert alert--error" role="alert">{{ formError }}</p>
        <BaseInput v-model="form.name" label="Nama instansi" maxlength="150" :error="fieldErrors.name" />
        <div class="field">
          <label for="agency-desc">Deskripsi (opsional)</label>
          <textarea id="agency-desc" v-model="form.description" class="control" rows="3" maxlength="2000"></textarea>
          <span v-if="fieldErrors.description" class="field__error" role="alert">{{ fieldErrors.description }}</span>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn" @click="formOpen = false">Batal</button>
          <BaseButton type="submit" :loading="saving">Simpan</BaseButton>
        </div>
      </form>
    </BaseModal>

    <BaseModal v-model="toggleOpen" title="Nonaktifkan instansi">
      <div class="admin-page admin-modal">
        <p v-if="toggleError" class="alert alert--error" role="alert">{{ toggleError }}</p>
        <p v-if="toggleTarget">
          Nonaktifkan <strong>{{ toggleTarget.name }}</strong>? Subjenisnya tidak akan muncul di form laporan warga.
          Laporan yang sedang berjalan tetap bisa ditangani.
        </p>
        <div class="modal-actions">
          <button type="button" class="btn" @click="toggleOpen = false">Batal</button>
          <BaseButton type="button" :loading="toggling" @click="setActive(toggleTarget, false)">Nonaktifkan</BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>