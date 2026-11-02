<script setup>
import { computed, ref, useAttrs } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  error: { type: String, default: '' },
  id: { type: String, default: () => `input-${Math.random().toString(36).slice(2, 9)}` },
  // Komponen ikon (mis. Mail dari lucide-vue-next) yang tampil di kiri input.
  icon: { type: [Object, Function], default: null },
  // Label tetap ada untuk screen reader, tapi tidak terlihat (pakai placeholder).
  hideLabel: { type: Boolean, default: false },
})
defineEmits(['update:modelValue'])

// class/style jatuh ke pembungkus; atribut lain (placeholder, autocomplete, dst) ke <input>.
defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const wrapperAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const inputAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs
  return rest
})

// Tombol tampil/sembunyikan otomatis untuk type="password".
const isPassword = computed(() => props.type === 'password')
const visible = ref(false)
const inputType = computed(() => (isPassword.value && visible.value ? 'text' : props.type))
</script>

<template>
  <div class="w-full" v-bind="wrapperAttrs">
    <label v-if="label" :for="id" :class="hideLabel ? 'sr-only' : 'mb-1.5 block text-sm font-semibold'">{{ label }}</label>

    <div class="relative">
      <component :is="icon" v-if="icon" class="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2" aria-hidden="true" />
      <input
        v-bind="inputAttrs"
        :id="id"
        :type="inputType"
        :value="modelValue"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${id}-error` : undefined"
        class="h-12 w-full rounded-full border bg-white/60 text-sm text-maroon placeholder:text-maroon/50 focus:outline-none focus:ring-2 focus:ring-lime"
        :class="[
          icon ? 'pl-12' : 'pl-5',
          isPassword ? 'pr-12' : 'pr-5',
          error ? 'border-red-600' : 'border-maroon/25 focus:border-maroon',
        ]"
        @input="$emit('update:modelValue', $event.target.value)"
      />
      <button
        v-if="isPassword"
        type="button"
        class="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full hover:bg-sand"
        :aria-label="visible ? 'Sembunyikan password' : 'Tampilkan password'"
        :aria-pressed="visible"
        @click="visible = !visible"
      >
        <EyeOff v-if="visible" class="size-5" aria-hidden="true" />
        <Eye v-else class="size-5" aria-hidden="true" />
      </button>
    </div>

    <span v-if="error" :id="`${id}-error`" class="mt-1.5 block px-2 text-xs font-medium text-red-700" role="alert">{{ error }}</span>
  </div>
</template>
