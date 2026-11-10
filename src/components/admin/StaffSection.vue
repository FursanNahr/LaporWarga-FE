<script setup>
import { computed, reactive, ref } from 'vue'
import { Building2, Mail, Pencil, Plus, Power, RotateCcw, Search } from 'lucide-vue-next'
import { adminApi } from '@/api/admin.api'
import { useFilteredList } from '@/composables/useFilteredList'
import { useMasterOptions } from '@/composables/useMasterOptions'
import { useToast } from '@/composables/useToast'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseEmptyState from '@/components/common/BaseEmptyState.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BasePagination from '@/components/common/BasePagination.vue'

/** StaffSection: akun petugas instansi (tambah, ubah, reset password, aktif/nonaktif). Tidak ada hapus permanen. */
const toast = useToast()
const { agencies } = useMasterOptions(['agencies'])
const activeAgencies = computed(() => agencies.value.filter((agency) => agency.isActive))

const { filters, items, loading, loadingMore, error, hasMore, loadMore, reload, reset, hasFilter, keywordTooShort } =
  useFilteredList(adminApi.listPetugas, { initial: { q: '', agencyId: '', isActive: '' }, limit: 15 })

// Dua huruf awal nama untuk avatar (data avatar tidak ikut di daftar petugas).
const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('') || '?'

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
    Object.assign(staff, body.data) // perbarui kartu tanpa memuat ulang
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

const alertClass = 'rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800'
const selectClass =
  'h-11 w-full cursor-pointer rounded-full border border-sand-dark bg-white/70 px-4 text-sm text-maroon focus:border-maroon focus:outline-none'
const ghostBtn =
  'inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border-2 border-maroon px-4 text-sm font-bold text-maroon transition-colors hover:bg-maroon hover:text-white'
</script>

<template>
  <div>
    <!-- Toolbar -->
    <form class="flex flex-col gap-3 lg:flex-row lg:items-start" role="search" @submit.prevent>
      <div class="w-full lg:max-w-sm">
        <label for="staff-q" class="sr-only">Cari petugas</label>
        <div class="relative">
          <Search class="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-maroon" aria-hidden="true" />
          <input
            id="staff-q"
            v-model="filters.q"
            type="search"
            placeholder="Cari nama atau email"
            class="h-11 w-full rounded-full border border-sand-dark bg-white/70 pl-11 pr-4 text-sm text-maroon placeholder:text-maroon/50 focus:border-maroon focus:outline-none"
          />
        </div>
        <p v-if="keywordTooShort" class="mt-1.5 pl-4 text-xs text-maroon/70">Kata kunci minimal 2 karakter.</p>
      </div>

      <div v-if="agencies.length" class="w-full lg:w-56">
        <label for="staff-agency" class="sr-only">Instansi</label>
        <select id="staff-agency" v-model="filters.agencyId" :class="selectClass">
          <option value="">Semua instansi</option>
          <option v-for="agency in agencies" :key="agency.id" :value="agency.id">{{ agency.name }}</option>
        </select>
      </div>

      <div class="w-full lg:w-40">
        <label for="staff-active" class="sr-only">Status</label>
        <select id="staff-active" v-model="filters.isActive" :class="selectClass">
          <option value="">Semua status</option>
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </select>
      </div>

      <button
        v-if="hasFilter"
        type="button"
        class="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-maroon px-4 text-sm font-bold text-maroon transition-colors hover:bg-maroon hover:text-white"
        @click="reset"
      >
        <RotateCcw class="size-4" aria-hidden="true" /> Atur ulang
      </button>

      <button
        type="button"
        class="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-lime px-5 text-sm font-bold text-maroon-dark transition-colors hover:bg-lime-dark lg:ml-auto"
        @click="openForm()"
      >
        <Plus class="size-4" aria-hidden="true" /> Tambah petugas
      </button>
    </form>

    <p v-if="error" :class="[alertClass, 'mt-6']" role="alert">{{ error }}</p>
    <BaseLoading v-if="loading" class="mt-10" text="Memuat petugas..." />
    <BaseEmptyState
      v-else-if="!items.length && !error"
      class="mt-10"
      :title="hasFilter ? 'Tidak ada petugas yang cocok' : 'Belum ada akun petugas'"
      description="Akun petugas dipakai instansi untuk memperbarui progres laporan."
    />

    <!-- Kartu petugas -->
    <ul v-else class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <li v-for="row in items" :key="row.id">
        <article
          class="flex h-full flex-col gap-4 rounded-2xl border p-5 transition-transform hover:-translate-y-0.5"
          :class="row.isActive ? 'border-sand-dark bg-sand' : 'border-dashed border-maroon/30 bg-sand/50'"
        >
          <div class="flex items-start gap-3">
            <span
              class="grid size-12 shrink-0 place-items-center rounded-full text-lg font-extrabold"
              :class="row.isActive ? 'bg-lime text-maroon-dark' : 'bg-white text-maroon/50'"
              aria-hidden="true"
            >
              {{ initials(row.name) }}
            </span>
            <div class="min-w-0 flex-1">
              <h2 class="break-words text-lg font-extrabold leading-tight text-maroon">{{ row.name }}</h2>
              <p class="mt-1 flex items-center gap-1.5 text-sm text-maroon/80">
                <Mail class="size-4 shrink-0" aria-hidden="true" />
                <span class="truncate">{{ row.email }}</span>
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <span class="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-maroon">
              <Building2 class="size-4 shrink-0" aria-hidden="true" />
              <span class="truncate">{{ row.agency?.name ?? '-' }}</span>
            </span>
            <BaseBadge v-if="row.isAgencyHead" variant="warning">Atasan</BaseBadge>
            <BaseBadge :variant="row.isActive ? 'success' : 'neutral'">{{ row.isActive ? 'Aktif' : 'Nonaktif' }}</BaseBadge>
          </div>

          <div class="mt-auto flex flex-wrap gap-2 border-t border-maroon/10 pt-4">
            <button type="button" :class="ghostBtn" @click="openForm(row)">
              <Pencil class="size-4" aria-hidden="true" /> Ubah
            </button>
            <button
              type="button"
              class="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border-2 px-4 text-sm font-bold transition-colors"
              :class="
                row.isActive
                  ? 'border-red-700 text-red-700 hover:bg-red-700 hover:text-white'
                  : 'border-maroon bg-lime text-maroon-dark hover:bg-lime-dark'
              "
              @click="askToggle(row)"
            >
              <Power class="size-4" aria-hidden="true" /> {{ row.isActive ? 'Nonaktifkan' : 'Aktifkan' }}
            </button>
          </div>
        </article>
      </li>
    </ul>

    <BasePagination :has-more="hasMore" :loading="loadingMore" @load-more="loadMore" />

    <!-- Modal tambah / ubah -->
    <BaseModal v-model="formOpen" :title="form.id ? 'Ubah akun petugas' : 'Tambah akun petugas'">
      <form class="space-y-4 text-maroon" novalidate @submit.prevent="save">
        <p v-if="formError" :class="alertClass" role="alert">{{ formError }}</p>
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
        <p v-else class="rounded-2xl bg-sand px-4 py-3 text-sm">
          Email: <strong>{{ form.email }}</strong> (tidak bisa diubah)
        </p>

        <div>
          <label for="staff-form-agency" class="mb-1.5 block text-sm font-semibold">Instansi</label>
          <select
            id="staff-form-agency"
            v-model="form.agencyId"
            class="h-12 w-full cursor-pointer rounded-full border bg-white/60 px-5 text-sm text-maroon focus:outline-none focus:ring-2 focus:ring-lime"
            :class="fieldErrors.agencyId ? 'border-red-600' : 'border-maroon/25 focus:border-maroon'"
            :aria-invalid="!!fieldErrors.agencyId"
          >
            <option value="" disabled>Pilih instansi</option>
            <option v-for="agency in activeAgencies" :key="agency.id" :value="agency.id">{{ agency.name }}</option>
          </select>
          <span v-if="fieldErrors.agencyId" class="mt-1.5 block px-2 text-xs font-medium text-red-700" role="alert">
            {{ fieldErrors.agencyId }}
          </span>
        </div>

        <BaseInput
          v-model="form.password"
          :label="form.id ? 'Reset password (kosongkan jika tidak diganti)' : 'Password awal'"
          type="password"
          autocomplete="new-password"
          :error="fieldErrors.password"
        />

        <label class="flex cursor-pointer items-center gap-3 rounded-2xl bg-sand px-4 py-3 text-sm font-semibold">
          <input v-model="form.isAgencyHead" type="checkbox" class="size-5 cursor-pointer accent-maroon" />
          Atasan instansi (menerima eskalasi SLA)
        </label>

        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="secondary" @click="formOpen = false">Batal</BaseButton>
          <BaseButton type="submit" :loading="saving">Simpan</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Modal konfirmasi nonaktifkan -->
    <BaseModal v-model="toggleOpen" title="Nonaktifkan akun petugas">
      <div class="space-y-4 text-maroon">
        <p v-if="toggleError" :class="alertClass" role="alert">{{ toggleError }}</p>
        <p v-if="toggleTarget" class="leading-relaxed">
          Nonaktifkan <strong>{{ toggleTarget.name }}</strong>? Akun ini tidak bisa masuk lagi sampai diaktifkan kembali.
          Riwayat pekerjaannya tetap tersimpan.
        </p>
        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="secondary" @click="toggleOpen = false">Batal</BaseButton>
          <BaseButton variant="danger" :loading="toggling" @click="setActive(toggleTarget, false)">Nonaktifkan</BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>