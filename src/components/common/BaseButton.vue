<script setup>
/**
 * BaseButton: tombol dengan state loading.
 * Memakai class global .btn / .btn-primary dari assets/styles/main.css,
 * jadi tampilannya sama dengan link yang diberi class btn (mis. tombol Masuk di navbar).
 *
 * Props
 *  - variant : 'primary' | 'secondary'
 *  - type    : 'button' | 'submit'
 *  - loading : Boolean (tombol dinonaktifkan dan teks diganti saat true)
 *
 * @click dan atribut lain diteruskan otomatis ke <button>.
 */
defineProps({
  variant: { type: String, default: 'primary' },
  type: { type: String, default: 'button' },
  loading: { type: Boolean, default: false },
})
</script>

<template>
  <button
    :type="type"
    :class="['btn', { 'btn-primary': variant === 'primary' }]"
    :disabled="loading"
    :aria-busy="loading"
  >
    <slot v-if="!loading" />
    <span v-else>Memproses...</span>
  </button>
</template>

<style scoped>
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>