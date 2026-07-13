<script setup>
defineProps({
  label: { type: String, default: "Click me" },
  variant: { type: String, default: "primary" },
  disabled: { type: Boolean, default: false },
});
</script>

<template>
  <button :class="`btn btn--${variant}`" :disabled="disabled">{{ label }}</button>
</template>
