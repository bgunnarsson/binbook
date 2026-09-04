<script setup>
import { provide } from 'vue'

// A decorator: provides context to the wrapped story. Real-world equivalents
// wrap children in a router (vue-router), a Pinia store, or an i18n instance.
provide('binbook:message', 'provided by decorator')
</script>

<template>
  <slot />
</template>
