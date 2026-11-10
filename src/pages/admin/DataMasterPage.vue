<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Building2, FileText, Layers, Pencil, Plus, Search, Trash2 } from 'lucide-vue-next'
import { adminApi } from '@/api/admin.api'
import { useMasterOptions } from '@/composables/useMasterOptions'
import { useToast } from '@/composables/useToast'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseEmptyState from '@/components/common/BaseEmptyState.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseLoading from '@/components/common/BaseLoading.vue'
import BaseModal from '@/components/common/BaseModal.vue'

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

// ---- Ringkasan & pencarian (di browser, datanya kecil) ----
const subTotal = computed(() => categories.value.reduce((sum, category) => sum + category.subcategories.length, 0))

const keyword = ref('')
const visibleCategories = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return categories.value
  return categories.value
    .map((category) => {
      if (category.name.toLowerCase().includes(q)) return category
      const subcategories = category.subcategories.filter(
        (sub) => sub.name.toLowerCase().includes(q) || sub.agency?.name?.toLowerCase().includes(q),
      )
      return { ...category, subcategories }
    })
    .filter((category) => category.name.toLowerCase().includes(q) || category.subcategories.length)
})

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

const alertClass = 'rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800'
const pillBtn =
  'inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border-2 px-4 text-sm font-bold transition-colors'
const iconBtn =
  'inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40'
const selectClass =
  'h-12 w-full cursor-pointer rounded-full border bg-white/60 px-5 text-sm text-maroon focus:outline-none focus:ring-2 focus:ring-lime'
</script>

<template>
  <section class="mx-auto w-full max-w-[1400px] px-5 py-8 lg:px-8">
    <!-- Header -->
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-4xl font-extrabold tracking-tight text-maroon sm:text-5xl">
          <span class="relative inline-block">
            Data
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
          Master
        </h1>
        <p class="mt-3 max-w-2xl text-lg text-maroon/80">
          Kategori, subjenis, dan instansi yang menanganinya. Subjenis yang sudah dipakai laporan tidak bisa dihapus,
          tetapi pemetaan instansinya bisa diubah (laporan lama tetap di instansi semula).
        </p>
      </div>

      <div v-if="!loading && !error" class="flex flex-wrap gap-3" aria-live="polite">
        <div class="rounded-2xl border border-sand-dark bg-sand px-5 py-3">
          <p class="text-2xl font-extrabold leading-none text-maroon">{{ categories.length }}</p>
          <p class="mt-1 text-xs font-semibold text-maroon/70">Kategori</p>
        </div>
        <div class="rounded-2xl border border-sand-dark bg-sand px-5 py-3">
          <p class="text-2xl font-extrabold leading-none text-maroon">{{ subTotal }}</p>
          <p class="mt-1 text-xs font-semibold text-maroon/70">Subjenis</p>
        </div>
      </div>
    </header>

    <!-- Toolbar -->
    <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="w-full sm:max-w-md">
        <label for="master-q" class="sr-only">Cari kategori atau subjenis</label>
        <div class="relative">
          <Search class="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-maroon" aria-hidden="true" />
          <input
            id="master-q"
            v-model="keyword"
            type="search"
            placeholder="Cari kategori, subjenis, atau instansi"
            class="h-11 w-full rounded-full border border-sand-dark bg-white/70 pl-11 pr-4 text-sm text-maroon placeholder:text-maroon/50 focus:border-maroon focus:outline-none"
          />
        </div>
      </div>
      <button
        type="button"
        class="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-lime px-5 text-sm font-bold text-maroon-dark transition-colors hover:bg-lime-dark"
        @click="openDialog('category-form')"
      >
        <Plus class="size-4" aria-hidden="true" /> Tambah kategori
      </button>
    </div>

    <p v-if="error" :class="[alertClass, 'mt-6']" role="alert">{{ error }}</p>
    <BaseLoading v-if="loading" class="mt-10" text="Memuat kategori..." />
    <BaseEmptyState
      v-else-if="!categories.length && !error"
      class="mt-10"
      title="Belum ada kategori"
      description="Tambahkan kategori pertama, lalu subjenisnya."
    />
    <BaseEmptyState
      v-else-if="!visibleCategories.length"
      class="mt-10"
      title="Tidak ada yang cocok"
      description="Coba kata kunci lain."
    />

    <!-- Kartu kategori -->
    <div v-else class="mt-6 space-y-5">
      <article
        v-for="category in visibleCategories"
        :key="category.id"
        class="rounded-2xl border border-sand-dark bg-sand p-5 sm:p-6"
        :aria-label="`Kategori ${category.name}`"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <span class="flex size-11 shrink-0 items-center justify-center rounded-full bg-lime text-maroon-dark" aria-hidden="true">
              <Layers class="size-5" />
            </span>
            <div class="min-w-0">
              <h2 class="break-words text-xl font-extrabold leading-tight text-maroon">{{ category.name }}</h2>
              <BaseBadge variant="primary" class="mt-1">{{ category.subcategories.length }} subjenis</BaseBadge>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              :class="[pillBtn, 'border-lime-dark bg-lime text-maroon-dark hover:bg-lime-dark']"
              @click="openDialog('sub-form', { category })"
            >
              <Plus class="size-4" aria-hidden="true" /> Tambah subjenis
            </button>
            <button
              type="button"
              :class="[pillBtn, 'border-maroon text-maroon hover:bg-maroon hover:text-white']"
              @click="openDialog('category-form', { category })"
            >
              <Pencil class="size-4" aria-hidden="true" /> Ubah nama
            </button>
            <button
              type="button"
              :class="[pillBtn, 'border-red-700 text-red-700 hover:bg-red-700 hover:text-white']"
              @click="openDialog('delete-category', { category })"
            >
              <Trash2 class="size-4" aria-hidden="true" /> Hapus
            </button>
          </div>
        </div>

        <!-- Subjenis -->
        <ul v-if="category.subcategories.length" class="mt-5 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          <li
            v-for="sub in category.subcategories"
            :key="sub.id"
            class="flex items-start justify-between gap-3 rounded-xl bg-white px-4 py-3.5"
          >
            <div class="min-w-0 space-y-1.5">
              <p class="break-words font-bold leading-tight text-maroon">{{ sub.name }}</p>
              <p class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-maroon/80">
                <Building2 class="size-4 shrink-0" aria-hidden="true" />
                <span>{{ sub.agency.name }}</span>
                <BaseBadge v-if="!sub.agency.isActive" variant="warning">Nonaktif</BaseBadge>
              </p>
              <p class="flex items-center gap-1.5 text-xs font-semibold text-maroon/70">
                <FileText class="size-3.5" aria-hidden="true" /> {{ sub.reportCount }} laporan
              </p>
            </div>

            <div class="flex shrink-0 gap-1.5">
              <button
                type="button"
                :class="[iconBtn, 'border-maroon text-maroon hover:bg-maroon hover:text-white']"
                :aria-label="`Ubah subjenis ${sub.name}`"
                title="Ubah"
                @click="openDialog('sub-form', { category, sub })"
              >
                <Pencil class="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                :class="[iconBtn, 'border-red-700 text-red-700 hover:bg-red-700 hover:text-white']"
                :disabled="sub.reportCount > 0"
                :aria-label="`Hapus subjenis ${sub.name}`"
                :title="sub.reportCount > 0 ? `Sudah dipakai ${sub.reportCount} laporan, tidak bisa dihapus` : 'Hapus'"
                @click="openDialog('delete-sub', { category, sub })"
              >
                <Trash2 class="size-4" aria-hidden="true" />
              </button>
            </div>
          </li>
        </ul>
        <p v-else class="mt-5 rounded-xl border border-dashed border-maroon/30 px-4 py-4 text-sm font-semibold text-maroon/70">
          Belum ada subjenis di kategori ini.
        </p>
      </article>
    </div>

    <!-- Dialog -->
    <BaseModal v-model="open" :title="title">
      <!-- Form tambah/ubah -->
      <form v-if="modal.type === 'category-form' || modal.type === 'sub-form'" class="space-y-4 text-maroon" novalidate @submit.prevent="save">
        <p v-if="formError" :class="alertClass" role="alert">{{ formError }}</p>
        <p v-if="modal.type === 'sub-form' && !modal.sub" class="rounded-2xl bg-sand px-4 py-3 text-sm">
          Kategori: <strong>{{ modal.category.name }}</strong>
        </p>

        <BaseInput
          v-model="form.name"
          :label="modal.type === 'category-form' ? 'Nama kategori' : 'Nama subjenis'"
          maxlength="100"
          :error="fieldErrors.name"
        />

        <template v-if="modal.type === 'sub-form'">
          <div>
            <label for="sub-agency" class="mb-1.5 block text-sm font-semibold">Instansi penanganan</label>
            <select
              id="sub-agency"
              v-model="form.agencyId"
              :class="[selectClass, fieldErrors.agencyId ? 'border-red-600' : 'border-maroon/25 focus:border-maroon']"
              :aria-invalid="!!fieldErrors.agencyId"
            >
              <option value="" disabled>Pilih instansi</option>
              <option v-for="agency in agencies" :key="agency.id" :value="agency.id" :disabled="!agency.isActive">
                {{ agency.name }}{{ agency.isActive ? '' : ' (nonaktif)' }}
              </option>
            </select>
            <span v-if="fieldErrors.agencyId" class="mt-1.5 block px-2 text-xs font-medium text-red-700" role="alert">
              {{ fieldErrors.agencyId }}
            </span>
          </div>

          <div v-if="modal.sub">
            <label for="sub-category" class="mb-1.5 block text-sm font-semibold">Kategori</label>
            <select id="sub-category" v-model="form.categoryId" :class="[selectClass, 'border-maroon/25 focus:border-maroon']">
              <option v-for="item in categories" :key="item.id" :value="item.id">{{ item.name }}</option>
            </select>
            <small class="mt-1.5 block px-2 text-xs text-maroon/70">Ganti untuk memindahkan subjenis ke kategori lain.</small>
          </div>
        </template>

        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="secondary" @click="open = false">Batal</BaseButton>
          <BaseButton type="submit" :loading="saving">Simpan</BaseButton>
        </div>
      </form>

      <!-- Konfirmasi hapus -->
      <div v-else class="space-y-4 text-maroon">
        <p v-if="formError" :class="alertClass" role="alert">{{ formError }}</p>
        <p v-if="modal.type === 'delete-category'" class="leading-relaxed">
          Hapus kategori <strong>{{ modal.category?.name }}</strong>? Kategori hanya bisa dihapus jika sudah tidak punya subjenis.
        </p>
        <p v-else class="leading-relaxed">
          Hapus subjenis <strong>{{ modal.sub?.name }}</strong>? Subjenis yang sudah dipakai laporan tidak bisa dihapus.
        </p>
        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="secondary" @click="open = false">Batal</BaseButton>
          <BaseButton variant="danger" :loading="saving" @click="confirmDelete">Hapus</BaseButton>
        </div>
      </div>
    </BaseModal>
  </section>
</template>