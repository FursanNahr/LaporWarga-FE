<script setup>
import { computed, reactive, ref } from 'vue'
import { adminApi } from '@/api/admin.api'
import { useFilteredList } from '@/composables/useFilteredList'
import { useMasterOptions } from '@/composables/useMasterOptions'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseEmptyState from '@/components/common/BaseEmptyState.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BasePagination from '@/components/common/BasePagination.vue'
import BaseTable from '@/components/common/BaseTable.vue'

/** StaffSection: akun petugas instansi (tambah, ubah, reset password, aktif/nonaktif). Tidak ada hapus permanen. */
const toast = useToast()
const { agencies } = useMasterOptions(['agencies'])
const activeAgencies = computed(() => agencies.value.filter((agency) => agency.isActive))

const { filters, items, loading, loadingMore, error, hasMore, loadMore, reload, reset, hasFilter, keywordTooShort } =
  useFilteredList(adminApi.listPetugas, { initial: { q: '', agencyId: '', isActive: '' }, limit: 15 })

const columns = [
  { key: 'name', label: 'Petugas' },
  { key: 'agency', label: 'Instansi' },
  { key: 'isActive', label: 'Status' },
]

// ---- Form tambah / ubah ----
const formOpen = ref(false)
const form = reactive({ id: null, name: '', email: '', password: '', agencyId: '', isAgencyHead: false })
const saving = ref(false)
const formError = ref('')
const fieldErrors = ref({})

function openForm(staff = null) {
  form.id = staff?.id ?? null
  form.name = staff?.name ?? ''
  form.email = staff?.email ?? ''
  form.password = ''
  form.agencyId = staff?.agencyId ?? ''
  form.isAgencyHead = staff?.isAgencyHead ?? false
  formError.value = ''
  fieldErrors.value = {}
  formOpen.value = true
}

function validate() {
  const errors = {}
  if (form.name.trim().length < 2) errors.name = 'Nama minimal 2 karakter.'
  if (!form.id && !/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Email tidak valid.'
  if (!form.agencyId) errors.agencyId = 'Pilih instansi.'
  // Saat membuat, password wajib. Saat mengubah, kosong = tidak diganti.
  if ((!form.id || form.password) && (form.password.length < 8 || form.password.length > 72)) {
    errors.password = 'Password 8 sampai 72 karakter.'
  }
  return errors
}

async function save() {
  if (saving.value) return
  formError.value = ''
  fieldErrors.value = validate()
  if (Object.keys(fieldErrors.value).length) return

  saving.value = true
  try {
    if (form.id) {
      await adminApi.ubahPetugas(form.id, {
        name: form.name.trim(),
        agencyId: Number(form.agencyId),
        isAgencyHead: form.isAgencyHead,
        ...(form.password && { password: form.password }),
      })
    } else {
      await adminApi.buatPetugas({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        agencyId: Number(form.agencyId),
        isAgencyHead: form.isAgencyHead,
      })
    }
    formOpen.value = false
    toast.success(form.id ? 'Akun petugas diperbarui.' : 'Akun petugas dibuat.')
    reload()
  } catch (e) {
    formError.value = e.normalized?.message ?? 'Gagal menyimpan akun petugas.'
    fieldErrors.value = e.normalized?.fieldErrors ?? {}
  } finally {
    saving.value = false
  }
}

// ---- Aktif / nonaktif (akun nonaktif tidak bisa masuk lagi) ----
const toggleTarget = ref(null)
const toggleOpen = ref(false)
const toggling = ref(false)
const toggleError = ref('')

async function setActive(staff, isActive) {
  toggling.value = true
  toggleError.value = ''
  try {
    const { data: body } = await adminApi.ubahPetugas(staff.id, { isActive })
    Object.assign(staff, body.data) // perbarui baris di tabel tanpa memuat ulang
    toggleOpen.value = false
    toast.success(isActive ? 'Akun diaktifkan.' : 'Akun dinonaktifkan.')
  } catch (e) {
    const message = e.normalized?.message ?? 'Gagal mengubah status akun.'
    if (toggleOpen.value) toggleError.value = message
    else toast.error(message)
  } finally {
    toggling.value = false
  }
}

function askToggle(staff) {
  if (!staff.isActive) return setActive(staff, true)
  toggleTarget.value = staff
  toggleError.value = ''
  toggleOpen.value = true
}
</script>

<template>
  <div>
    <form class="filters" role="search" @submit.prevent>
      <div class="filters__field filters__field--grow">
        <label for="staff-q">Cari petugas</label>
        <input id="staff-q" v-model="filters.q" class="control" type="search" placeholder="Nama atau email" />
        <small v-if="keywordTooShort" class="hint">Kata kunci minimal 2 karakter.</small>
      </div>
      <div v-if="agencies.length" class="filters__field">
        <label for="staff-agency">Instansi</label>
        <select id="staff-agency" v-model="filters.agencyId" class="control">
          <option value="">Semua instansi</option>
          <option v-for="agency in agencies" :key="agency.id" :value="agency.id">{{ agency.name }}</option>
        </select>
      </div>
      <div class="filters__field">
        <label for="staff-active">Status</label>
        <select id="staff-active" v-model="filters.isActive" class="control">
          <option value="">Semua</option>
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </select>
      </div>
      <button v-if="hasFilter" type="button" class="btn" @click="reset">Atur ulang</button>
      <button type="button" class="btn btn-primary" @click="openForm()">Tambah petugas</button>
    </form>

    <p v-if="error" class="alert alert--error" role="alert">{{ error }}</p>
    <BaseLoading v-if="loading" text="Memuat petugas..." />
    <BaseEmptyState
      v-else-if="!items.length && !error"
      :title="hasFilter ? 'Tidak ada petugas yang cocok' : 'Belum ada akun petugas'"
      description="Akun petugas dipakai instansi untuk memperbarui progres laporan."
    />

    <BaseTable v-else :columns="columns" :rows="items" actions-label="Aksi" caption="Daftar akun petugas">
      <template #cell-name="{ row }">
        <strong>{{ row.name }}</strong>
        <span class="muted">{{ row.email }}</span>
      </template>
      <template #cell-agency="{ row }">
        {{ row.agency?.name ?? '-' }}
        <span v-if="row.isAgencyHead" class="tag tag--warn">Atasan</span>
      </template>
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

    <BasePagination :has-more="hasMore" :loading="loadingMore" @load-more="loadMore" />

    <BaseModal v-model="formOpen" :title="form.id ? 'Ubah akun petugas' : 'Tambah akun petugas'">
      <form class="admin-page admin-modal" novalidate @submit.prevent="save">
        <p v-if="formError" class="alert alert--error" role="alert">{{ formError }}</p>
        <BaseInput v-model="form.name" label="Nama" maxlength="100" autocomplete="off" :error="fieldErrors.name" />
        <BaseInput
          v-if="!form.id"
          v-model="form.email"
          label="Email"
          type="email"
          maxlength="191"
          autocomplete="off"
          :error="fieldErrors.email"
        />
        <p v-else class="hint">Email: {{ form.email }} (tidak bisa diubah)</p>

        <div class="field">
          <label for="staff-form-agency">Instansi</label>
          <select id="staff-form-agency" v-model="form.agencyId" class="control" :aria-invalid="!!fieldErrors.agencyId">
            <option value="" disabled>Pilih instansi</option>
            <option v-for="agency in activeAgencies" :key="agency.id" :value="agency.id">{{ agency.name }}</option>
          </select>
          <span v-if="fieldErrors.agencyId" class="field__error" role="alert">{{ fieldErrors.agencyId }}</span>
        </div>

        <BaseInput
          v-model="form.password"
          :label="form.id ? 'Reset password (kosongkan jika tidak diganti)' : 'Password awal'"
          type="password"
          autocomplete="new-password"
          :error="fieldErrors.password"
        />

        <label class="filters__check">
          <input v-model="form.isAgencyHead" type="checkbox" />
          Atasan instansi (menerima eskalasi SLA)
        </label>

        <div class="modal-actions">
          <button type="button" class="btn" @click="formOpen = false">Batal</button>
          <BaseButton type="submit" :loading="saving">Simpan</BaseButton>
        </div>
      </form>
    </BaseModal>

    <BaseModal v-model="toggleOpen" title="Nonaktifkan akun petugas">
      <div class="admin-page admin-modal">
        <p v-if="toggleError" class="alert alert--error" role="alert">{{ toggleError }}</p>
        <p v-if="toggleTarget">
          Nonaktifkan <strong>{{ toggleTarget.name }}</strong>? Akun ini tidak bisa masuk lagi sampai diaktifkan kembali.
          Riwayat pekerjaannya tetap tersimpan.
        </p>
        <div class="modal-actions">
          <button type="button" class="btn" @click="toggleOpen = false">Batal</button>
          <BaseButton type="button" :loading="toggling" @click="setActive(toggleTarget, false)">Nonaktifkan</BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>