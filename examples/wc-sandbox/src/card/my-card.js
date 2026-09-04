// A vanilla custom element rendering into light DOM so the project's injected
// stylesheet styles it (compare the Lit counter, which uses shadow DOM).
class MyCard extends HTMLElement {
  static get observedAttributes() {
    return ['title', 'body', 'variant']
  }
  connectedCallback() {
    this.render()
  }
  attributeChangedCallback() {
    this.render()
  }
  render() {
    const title = this.getAttribute('title') ?? 'Card title'
    const body = this.getAttribute('body') ?? 'Card body text.'
    const variant = this.getAttribute('variant') ?? 'default'
    this.innerHTML = `<article class="card card--${variant}"><h3 class="card__title">${title}</h3><p class="card__body">${body}</p></article>`
  }
}
customElements.define('my-card', MyCard)
