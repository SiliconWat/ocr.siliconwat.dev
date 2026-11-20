/** Every screen is a LIGHT-DOM Lit element (it renders into the page, so the Tailwind utilities reach it) that renders
 *  again when the language changes. No decorators: reactive properties are declared with `static properties`. */
import { LitElement } from "lit";
import { onLang } from "../i18n";

export class Light extends LitElement {
  private offLang?: () => void;
  createRenderRoot() {
    return this;
  }
  connectedCallback() {
    super.connectedCallback();
    this.offLang = onLang(() => this.requestUpdate());
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.offLang?.();
  }
  /** Sends an event up to the app. */
  protected emit<T>(name: string, detail?: T) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }
}

/** True on a computer-sized window with a mouse (the drawings' D1/D4 say "Click"; phones say "Tap"). */
export const clicks = () =>
  typeof matchMedia !== "undefined" && matchMedia("(min-width: 1024px) and (pointer: fine)").matches;
