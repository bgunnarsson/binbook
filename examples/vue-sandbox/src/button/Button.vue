<script setup>
defineProps({
  label: { type: String, default: 'Click me' },
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false },
})
</script>

<template>
  <button :class="`btn btn--${variant} btn--${size}`" :disabled="disabled">{{ label }}</button>
</template>
