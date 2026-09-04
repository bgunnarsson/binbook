<script>
  import { getContext } from "svelte";

  const { name = "there" } = $props();

  // Consumes context that must come from a provider up the tree — supplied by
  // the WithMessage decorator. Without it, this falls back to the default.
  const message = getContext("binbook:message") ?? "no provider";
</script>

<p class="greeting">Hi {name} — <strong data-message>{message}</strong></p>
