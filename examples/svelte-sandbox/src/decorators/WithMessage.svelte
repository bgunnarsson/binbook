<script>
  import { setContext } from "svelte";

  // A decorator: provides context to the wrapped story via setContext. Real
  // equivalents wrap children in a store, an i18n context, or a router.
  const { children } = $props();
  setContext("binbook:message", "provided by decorator");
</script>

{@render children()}
