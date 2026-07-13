// A vanilla custom element (no framework) — renders light DOM so the project's
// injected stylesheet applies.
class MyButton extends HTMLElement {
  static get observedAttributes() {
    return ["label", "variant", "disabled"];
  }
  connectedCallback() {
    this.render();
  }
  attributeChangedCallback() {
    this.render();
  }
  render() {
    const label = this.getAttribute("label") ?? "";
    const variant = this.getAttribute("variant") ?? "primary";
    const disabled = this.hasAttribute("disabled");
    this.innerHTML = `<button class="btn btn--${variant}"${disabled ? " disabled" : ""}>${label}</button>`;
  }
}
customElements.define("my-button", MyButton);
