<script setup>
defineProps({ title: { type: String, default: "Card" } });
</script>

<template>
  <article class="card">{{ title }}</article>
</template>

<style scoped>
.card { padding: 20px; }
</style>
