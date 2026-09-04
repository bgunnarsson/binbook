<script>
const { label = 'Count', start = 0, step = 1 } = $props()
const count = $state(start)
</script>

<div class="counter">
  <button class="btn btn--primary btn--md" aria-label="decrement" onclick={() => (count -= step)}>−</button>
  <output class="counter__value" aria-label="count">{label}: {count}</output>
  <button class="btn btn--primary btn--md" aria-label="increment" onclick={() => (count += step)}>+</button>
</div>
