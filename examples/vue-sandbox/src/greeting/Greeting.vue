<script setup>
import { inject } from "vue";

defineProps({ name: { type: String, default: "there" } });

// Consumes context that must come from a provider up the tree — supplied by the
// withMessage decorator. Without it, this falls back to the default.
const message = inject("binbook:message", "no provider");
</script>

<template>
  <p class="greeting">Hi {{ name }} — <strong data-message>{{ message }}</strong></p>
</template>
