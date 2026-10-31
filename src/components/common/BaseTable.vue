<script setup>
/**
 * BaseTable: tabel sederhana yang bisa digeser mendatar di layar sempit.
 *  - columns: [{ key, label, align?: 'left' | 'right' | 'center' }]
 *  - rows: array objek. Isi sel bisa diganti lewat slot `cell-<key>` ({ row, value }).
 *  - actionsLabel: jika diisi, ada kolom terakhir untuk slot `actions` ({ row }).
 */
defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  rowKey: { type: String, default: 'id' },
  caption: { type: String, default: '' },
  actionsLabel: { type: String, default: '' },
})
</script>

<template>
  <div class="table-wrap" role="region" tabindex="0" :aria-label="caption || 'Tabel data'">
    <table class="table">
      <caption v-if="caption" class="sr-only">{{ caption }}</caption>
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.key" scope="col" :class="column.align && `is-${column.align}`">
            {{ column.label }}
          </th>
          <th v-if="actionsLabel" scope="col" class="is-right">{{ actionsLabel }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row[rowKey]">
          <td v-for="column in columns" :key="column.key" :class="column.align && `is-${column.align}`">
            <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
              {{ row[column.key] ?? '-' }}
            </slot>
          </td>
          <td v-if="actionsLabel" class="is-right">
            <div class="table__actions"><slot name="actions" :row="row" /></div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-wrap {
  overflow-x: auto;
  margin-bottom: 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}
.table-wrap:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.table { width: 100%; border-collapse: collapse; font-size: 0.9375rem; }
th,
td {
  padding: 0.625rem 0.875rem;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
  vertical-align: top;
}
thead th {
  background: var(--color-bg-soft);
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
}
tbody tr:last-child td { border-bottom: 0; }
.is-right { text-align: right; }
.is-center { text-align: center; }
.table__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 0.375rem; }
</style>