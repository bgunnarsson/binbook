<script setup>
import { ref } from 'vue'

const props = defineProps({
  label: { type: String, default: 'Count' },
  start: { type: Number, default: 0 },
  step: { type: Number, default: 1 },
})

// Reactive state — only "works" once the story is hydrated in the canvas.
const count = ref(props.start)
</script>

<template>
  <div class="counter">
    <button class="btn btn--primary btn--md" aria-label="decrement" @click="count -= step">−</button>
    <output class="counter__value" aria-label="count">{{ label }}: {{ count }}</output>
    <button class="btn btn--primary btn--md" aria-label="increment" @click="count += step">+</button>
  </div>
</template>
