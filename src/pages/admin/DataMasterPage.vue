<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { adminApi } from '@/api/admin.api'
import { useMasterOptions } from '@/composables/useMasterOptions'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseEmptyState from '@/components/common/BaseEmptyState.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseTable from '@/components/common/BaseTable.vue'

const toast = useToast()
const { agencies } = useMasterOptions(['agencies'])

const categories = ref([])
const loading = ref(true)
const error = ref('')

async function load() {
  error.value = ''
  try {
    const { data: body } = await adminApi.listKategori()
    categories.value = body.data
  } catch (e) {
    error.value = e.normalized?.message ?? 'Gagal memuat kategori.'
  } finally {
    loading.value = false
  }
}
onMounted(load)

const subColumns = [
  { key: 'name', label: 'Subjenis' },
  { key: 'agency', label: 'Instansi penanganan' },
  { key: 'reportCount', label: 'Laporan', align: 'right' },
]

// ---- Satu dialog untuk semua aksi ----
// type: 'category-form' | 'sub-form' | 'delete-category' | 'delete-sub'
const modal = reactive({ type: '', category: null, sub: null })
const form = reactive({ name: '', agencyId: '', categoryId: '' })
const saving = ref(false)
const formError = ref('')
const fieldErrors = ref({})

const open = computed({
  get: () => modal.type !== '',
  set: (value) => {
    if (!value) modal.type = ''
  },
})

const title = computed(() => {
  switch (modal.type) {
    case 'category-form':
      return modal.category ? 'Ubah nama kategori' : 'Tambah kategori'
    case 'sub-form':
      return modal.sub ? 'Ubah subjenis' : 'Tambah subjenis'
    case 'delete-category':
      return 'Hapus kategori'
    default:
      return 'Hapus subjenis'
  }
})

function openDialog(type, { category = null, sub = null } = {}) {
  modal.type = type
  modal.category = category
  modal.sub = sub
  formError.value = ''
  fieldErrors.value = {}
  form.name = type === 'category-form' ? (category?.name ?? '') : (sub?.name ?? '')
  form.agencyId = sub?.agency?.id ?? ''
  form.categoryId = sub?.categoryId ?? category?.id ?? ''
}

async function save() {
  if (saving.value) return
  formError.value = ''
  fieldErrors.value = {}

  const name = form.name.trim()
  if (name.length < 3) {
    fieldErrors.value = { name: 'Nama minimal 3 karakter.' }
    return
  }
  if (modal.type === 'sub-form' && !form.agencyId) {
    fieldErrors.value = { agencyId: 'Pilih instansi penanganan.' }
    return
  }

  saving.value = true
  try {
    if (modal.type === 'category-form') {
      if (modal.category) await adminApi.ubahKategori(modal.category.id, { name })
      else await adminApi.buatKategori({ name })
    } else if (modal.sub) {
      await adminApi.ubahSubjenis(modal.sub.id, {
        name,
        agencyId: Number(form.agencyId),
        categoryId: Number(form.categoryId),
      })
    } else {
      await adminApi.buatSubjenis(modal.category.id, { name, agencyId: Number(form.agencyId) })
    }
    toast.success('Perubahan disimpan.')
    modal.type = ''
    await load()
  } catch (e) {
    formError.value = e.normalized?.message ?? 'Gagal menyimpan.'
    fieldErrors.value = e.normalized?.fieldErrors ?? {}
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  if (saving.value) return
  saving.value = true
  formError.value = ''
  try {
    if (modal.type === 'delete-category') await adminApi.hapusKategori(modal.category.id)
    else await adminApi.hapusSubjenis(modal.sub.id)
    toast.success('Berhasil dihapus.')
    modal.type = ''
    await load()
  } catch (e) {
    // Mis. 409: masih punya subjenis, atau subjenis sudah dipakai laporan.
    formError.value = e.normalized?.message ?? 'Gagal menghapus.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="container admin-page">
    <header class="page-header">
      <div>
        <h1>Data master</h1>
        <p>
          Kategori, subjenis, dan instansi yang menanganinya. Subjenis yang sudah dipakai laporan tidak bisa dihapus,
          tetapi pemetaan instansinya bisa diubah (laporan lama tetap di instansi semula).
        </p>
      </div>
      <button type="button" class="btn btn-primary" @click="openDialog('category-form')">Tambah kategori</button>
    </header>

    <p v-if="error" class="alert alert--error" role="alert">{{ error }}</p>
    <BaseLoading v-if="loading" text="Memuat kategori..." />
    <BaseEmptyState v-else-if="!categories.length && !error" title="Belum ada kategori" description="Tambahkan kategori pertama, lalu subjenisnya." />

    <section v-for="category in categories" :key="category.id" class="panel" :aria-label="`Kategori ${category.name}`">
      <div class="page-header">
        <h2>{{ category.name }} <span class="tag">{{ category.subcategories.length }} subjenis</span></h2>
        <div class="row">
          <button type="button" class="btn btn--sm" @click="openDialog('sub-form', { category })">Tambah subjenis</button>
          <button type="button" class="btn btn--sm" @click="openDialog('category-form', { category })">Ubah nama</button>
          <button type="button" class="btn btn--sm btn--danger" @click="openDialog('delete-category', { category })">Hapus</button>
        </div>
      </div>

      <BaseTable
        v-if="category.subcategories.length"
        :columns="subColumns"
        :rows="category.subcategories"
        actions-label="Aksi"
        :caption="`Subjenis kategori ${category.name}`"
      >
        <template #cell-agency="{ value }">
          {{ value.name }} <span v-if="!value.isActive" class="tag tag--warn">Nonaktif</span>
        </template>
        <template #actions="{ row }">
          <button type="button" class="btn btn--sm" @click="openDialog('sub-form', { category, sub: row })">Ubah</button>
          <button type="button" class="btn btn--sm btn--danger" @click="openDialog('delete-sub', { category, sub: row })">Hapus</button>
        </template>
      </BaseTable>
      <p v-else class="muted">Belum ada subjenis di kategori ini.</p>
    </section>

    <BaseModal v-model="open" :title="title">
      <!-- Form tambah/ubah -->
      <form v-if="modal.type === 'category-form' || modal.type === 'sub-form'" class="admin-page admin-modal" novalidate @submit.prevent="save">
        <p v-if="formError" class="alert alert--error" role="alert">{{ formError }}</p>
        <p v-if="modal.type === 'sub-form' && !modal.sub" class="hint">Kategori: {{ modal.category.name }}</p>

        <BaseInput
          v-model="form.name"
          :label="modal.type === 'category-form' ? 'Nama kategori' : 'Nama subjenis'"
          maxlength="100"
          :error="fieldErrors.name"
        />

        <template v-if="modal.type === 'sub-form'">
          <div class="field">
            <label for="sub-agency">Instansi penanganan</label>
            <select id="sub-agency" v-model="form.agencyId" class="control" :aria-invalid="!!fieldErrors.agencyId">
              <option value="" disabled>Pilih instansi</option>
              <option v-for="agency in agencies" :key="agency.id" :value="agency.id" :disabled="!agency.isActive">
                {{ agency.name }}{{ agency.isActive ? '' : ' (nonaktif)' }}
              </option>
            </select>
            <span v-if="fieldErrors.agencyId" class="field__error" role="alert">{{ fieldErrors.agencyId }}</span>
          </div>

          <div v-if="modal.sub" class="field">
            <label for="sub-category">Kategori</label>
            <select id="sub-category" v-model="form.categoryId" class="control">
              <option v-for="item in categories" :key="item.id" :value="item.id">{{ item.name }}</option>
            </select>
            <small class="hint">Ganti untuk memindahkan subjenis ke kategori lain.</small>
          </div>
        </template>

        <div class="modal-actions">
          <button type="button" class="btn" @click="open = false">Batal</button>
          <BaseButton type="submit" :loading="saving">Simpan</BaseButton>
        </div>
      </form>

      <!-- Konfirmasi hapus -->
      <div v-else class="admin-page admin-modal">
        <p v-if="formError" class="alert alert--error" role="alert">{{ formError }}</p>
        <p v-if="modal.type === 'delete-category'">
          Hapus kategori <strong>{{ modal.category?.name }}</strong>? Kategori hanya bisa dihapus jika sudah tidak punya subjenis.
        </p>
        <p v-else>
          Hapus subjenis <strong>{{ modal.sub?.name }}</strong>? Subjenis yang sudah dipakai laporan tidak bisa dihapus.
        </p>
        <div class="modal-actions">
          <button type="button" class="btn" @click="open = false">Batal</button>
          <BaseButton type="button" :loading="saving" @click="confirmDelete">Hapus</BaseButton>
        </div>
      </div>
    </BaseModal>
  </section>
</template>