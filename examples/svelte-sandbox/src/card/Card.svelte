<script>
const { title = 'Card title', body = 'Card body text.', variant = 'default' } = $props()
</script>

<article class="card card--{variant}">
  <h3 class="card__title">{title}</h3>
  <p class="card__body">{body}</p>
</article>
