<script>
  const { label = "Click me", variant = "primary", size = "md", disabled = false } = $props();
</script>

<button class="btn btn--{variant} btn--{size}" {disabled}>{label}</button>
