import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";

// A Lit component (shadow DOM + reactive state). It's interactive purely from
// the client bundle the adapter ships — clicking updates state, no round-trip.
@customElement("lit-counter")
export class LitCounter extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      font: 600 15px/1 system-ui, sans-serif;
    }
    button {
      font: inherit;
      padding: 8px 14px;
      border-radius: 8px;
      border: 1px solid #324fff;
      background: #324fff;
      color: #fff;
      cursor: pointer;
    }
    .value {
      min-width: 96px;
      text-align: center;
      color: #1a1a2e;
    }
  `;

  @property({ type: String }) label = "Count";
  @property({ type: Number }) step = 1;
  @state() private count = 0;

  connectedCallback() {
    super.connectedCallback();
    const start = this.getAttribute("start");
    if (start != null) this.count = Number(start);
  }

  render() {
    return html`
      <button aria-label="decrement" @click=${() => (this.count -= this.step)}>−</button>
      <output class="value" aria-label="count">${this.label}: ${this.count}</output>
      <button aria-label="increment" @click=${() => (this.count += this.step)}>+</button>
    `;
  }
}
