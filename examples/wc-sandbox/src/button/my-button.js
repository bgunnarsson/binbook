// A vanilla custom element (no framework). It renders into light DOM so the
// project's injected stylesheet (see binbook.config.ts) styles it.
class MyButton extends HTMLElement {
  static get observedAttributes() {
    return ["label", "variant", "size", "disabled"];
  }
  connectedCallback() {
    this.render();
  }
  attributeChangedCallback() {
    this.render();
  }
  render() {
    const label = this.getAttribute("label") ?? "Click me";
    const variant = this.getAttribute("variant") ?? "primary";
    const size = this.getAttribute("size") ?? "md";
    const disabled = this.hasAttribute("disabled");
    this.innerHTML = `<button class="btn btn--${variant} btn--${size}"${disabled ? " disabled" : ""}>${label}</button>`;
  }
}
customElements.define("my-button", MyButton);
