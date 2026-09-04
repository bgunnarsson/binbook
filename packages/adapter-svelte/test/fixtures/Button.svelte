<script>
  const { label = "Click me", variant = "primary", disabled = false } = $props();
</script>

<button class="btn btn--{variant}" {disabled}>{label}</button>
