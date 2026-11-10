<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Building2, FileText, Layers, Pencil, Plus, Power, Search, Users } from 'lucide-vue-next'
import { adminApi } from '@/api/admin.api'
import { useToast } from '@/composables/useToast'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseEmptyState from '@/components/common/BaseEmptyState.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import BaseModal from '@/components/common/BaseModal.vue'

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

const statTiles = (agency) => [
  { icon: Users, label: 'Petugas', value: agency.counts.staff },
  { icon: Layers, label: 'Subjenis', value: agency.counts.subcategories },
  { icon: FileText, label: 'Laporan', value: agency.counts.reports },
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

const alertClass = 'rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800'
const ghostBtn =
  'inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border-2 border-maroon px-4 text-sm font-bold text-maroon transition-colors hover:bg-maroon hover:text-white'
</script>

<template>
  <div>
    <!-- Toolbar -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="w-full sm:max-w-md">
        <label for="agency-q" class="sr-only">Cari instansi</label>
        <div class="relative">
          <Search class="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-maroon" aria-hidden="true" />
          <input
            id="agency-q"
            v-model="keyword"
            type="search"
            placeholder="Cari nama instansi"
            class="h-11 w-full rounded-full border border-sand-dark bg-white/70 pl-11 pr-4 text-sm text-maroon placeholder:text-maroon/50 focus:border-maroon focus:outline-none"
          />
        </div>
      </div>
      <button
        type="button"
        class="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-lime px-5 text-sm font-bold text-maroon-dark transition-colors hover:bg-lime-dark"
        @click="openForm()"
      >
        <Plus class="size-4" aria-hidden="true" /> Tambah instansi
      </button>
    </div>

    <p v-if="error" :class="[alertClass, 'mt-6']" role="alert">{{ error }}</p>
    <BaseLoading v-if="loading && !agencies.length" class="mt-10" text="Memuat instansi..." />
    <BaseEmptyState
      v-else-if="!rows.length && !error"
      class="mt-10"
      title="Tidak ada instansi"
      description="Tambahkan instansi pertama, atau ubah kata kunci pencarian."
    />

    <!-- Kartu instansi -->
    <ul v-else class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <li v-for="row in rows" :key="row.id">
        <article
          class="flex h-full flex-col gap-4 rounded-2xl border p-5 transition-transform hover:-translate-y-0.5"
          :class="row.isActive ? 'border-sand-dark bg-sand' : 'border-dashed border-maroon/30 bg-sand/50'"
        >
          <div class="flex items-start gap-3">
            <span
              class="flex size-11 shrink-0 items-center justify-center rounded-full"
              :class="row.isActive ? 'bg-lime text-maroon-dark' : 'bg-white text-maroon/50'"
              aria-hidden="true"
            >
              <Building2 class="size-5" />
            </span>
            <div class="min-w-0 flex-1">
              <h2 class="break-words text-lg font-extrabold leading-tight text-maroon">{{ row.name }}</h2>
              <BaseBadge :variant="row.isActive ? 'success' : 'neutral'" class="mt-1.5">
                {{ row.isActive ? 'Aktif' : 'Nonaktif' }}
              </BaseBadge>
            </div>
          </div>

          <p class="line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-maroon/80">
            {{ row.description || 'Belum ada deskripsi.' }}
          </p>

          <dl class="grid grid-cols-3 gap-2">
            <div v-for="tile in statTiles(row)" :key="tile.label" class="rounded-xl bg-white px-3 py-2.5 text-center">
              <dt class="flex items-center justify-center gap-1 text-[11px] font-semibold text-maroon/70">
                <component :is="tile.icon" class="size-3.5" aria-hidden="true" /> {{ tile.label }}
              </dt>
              <dd class="mt-0.5 text-xl font-extrabold text-maroon">{{ tile.value }}</dd>
            </div>
          </dl>

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

    <!-- Modal tambah / ubah -->
    <BaseModal v-model="formOpen" :title="form.id ? 'Ubah instansi' : 'Tambah instansi'">
      <form class="space-y-4 text-maroon" novalidate @submit.prevent="save">
        <p v-if="formError" :class="alertClass" role="alert">{{ formError }}</p>
        <BaseInput v-model="form.name" label="Nama instansi" maxlength="150" :error="fieldErrors.name" />
        <div>
          <label for="agency-desc" class="mb-1.5 block text-sm font-semibold">Deskripsi (opsional)</label>
          <textarea
            id="agency-desc"
            v-model="form.description"
            rows="3"
            maxlength="2000"
            class="w-full rounded-2xl border border-maroon/25 bg-white/60 px-5 py-3 text-sm text-maroon placeholder:text-maroon/50 focus:border-maroon focus:outline-none focus:ring-2 focus:ring-lime"
          ></textarea>
          <span v-if="fieldErrors.description" class="mt-1.5 block px-2 text-xs font-medium text-red-700" role="alert">
            {{ fieldErrors.description }}
          </span>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="secondary" @click="formOpen = false">Batal</BaseButton>
          <BaseButton type="submit" :loading="saving">Simpan</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Modal konfirmasi nonaktifkan -->
    <BaseModal v-model="toggleOpen" title="Nonaktifkan instansi">
      <div class="space-y-4 text-maroon">
        <p v-if="toggleError" :class="alertClass" role="alert">{{ toggleError }}</p>
        <p v-if="toggleTarget" class="leading-relaxed">
          Nonaktifkan <strong>{{ toggleTarget.name }}</strong>? Subjenisnya tidak akan muncul di form laporan warga.
          Laporan yang sedang berjalan tetap bisa ditangani.
        </p>
        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="secondary" @click="toggleOpen = false">Batal</BaseButton>
          <BaseButton variant="danger" :loading="toggling" @click="setActive(toggleTarget, false)">Nonaktifkan</BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>