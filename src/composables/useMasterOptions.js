import { onMounted, ref } from 'vue'
import { adminApi } from '@/api/admin.api'
import { masterApi } from '@/api/master.api'

/**
 * Pilihan dropdown dari master data (untuk halaman admin).
 *   const { agencies, districts, categories } = useMasterOptions(['agencies', 'districts'])
 * Yang gagal dimuat dibiarkan kosong; halaman cukup menyembunyikan dropdown-nya.
 *  - categories: [{ id, name, subcategories: [{ id, name, agency, reportCount }] }]
 *  - districts : [{ id, name }]
 *  - agencies  : [{ id, name, isActive, ... }] (termasuk yang nonaktif)
 */
export function useMasterOptions(which = ['categories', 'districts', 'agencies']) {
  const categories = ref([])
  const districts = ref([])
  const agencies = ref([])

  const sources = {
    categories: [categories, () => adminApi.listKategori()],
    districts: [districts, () => masterApi.districts()],
    agencies: [agencies, () => adminApi.listInstansi()],
  }

  async function load() {
    await Promise.all(
      which.map(async (key) => {
        const [target, fetch] = sources[key]
        try {
          const { data: body } = await fetch()
          target.value = body.data ?? []
        } catch {
          /* dropdown dibiarkan kosong */
        }
      }),
    )
  }

  onMounted(load)
  return { categories, districts, agencies, reload: load }
}