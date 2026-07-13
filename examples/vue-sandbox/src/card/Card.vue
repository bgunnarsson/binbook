<script setup>
defineProps({
  title: { type: String, default: "Card title" },
  body: { type: String, default: "Card body text." },
  variant: { type: String, default: "default" },
});
</script>

<template>
  <article :class="`card card--${variant}`">
    <h3 class="card__title">{{ title }}</h3>
    <p class="card__body">{{ body }}</p>
  </article>
</template>
