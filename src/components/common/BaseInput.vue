<script setup>
/**
 * BaseInput: label + input + pesan error.
 *
 * Props
 *  - modelValue : String  (pakai v-model)
 *  - label      : String
 *  - type       : String  (text, email, password, ...)
 *  - error      : String  (kosong = tidak ada error)
 *  - id         : String  (opsional, dibuat otomatis kalau tidak diisi)
 *
 * Atribut lain (autocomplete, placeholder, required, dst.) otomatis diteruskan ke <input>.
 */
defineOptions({ inheritAttrs: false })

defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  error: { type: String, default: '' },
  id: { type: String, default: () => `input-${Math.random().toString(36).slice(2, 9)}` },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="field">
    <label v-if="label" :for="id">{{ label }}</label>
    <input
      v-bind="$attrs"
      :id="id"
      :type="type"
      :value="modelValue"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${id}-error` : undefined"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <span v-if="error" :id="`${id}-error`" class="field__error" role="alert">{{ error }}</span>
  </div>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}
.field input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font: inherit;
}
.field input[aria-invalid='true'] { border-color: #b91c1c; }
.field__error { color: #b91c1c; font-size: 0.875rem; }
</style>