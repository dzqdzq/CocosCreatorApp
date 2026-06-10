Object.defineProperty(exports, "__esModule", { value: true });
const TagName = "inspector-resize-preview";

const STYLE = `
:host {
  height: 1px;
  background-color: var(--color-normal-border);
  cursor: ns-resize;
}
:host([focused]) {
  background-color: var(--color-focus-fill);
}
`;

const Config = {
  header: { value: 200, min: 200, moveBottom: true },
  footer: { value: 200, min: 200, moveBottom: false },
};

class InspectorResizePreview extends HTMLElement {
  get inspectorRootElement() {
    if (this._inspectorRootElement) {
      return this._inspectorRootElement;
    }
    this._inspectorRootElement = this.getInspectorRootElement();
  }
  getInspectorRootElement() {
    let e = this;

    while (
      e &&
      (!(e = e.parentElement || e.getRootNode().host) ||
        e.tagName !== "PANEL-FRAME" ||
        e.getAttribute("name") !== "inspector")
    ) {}

    return e;
  }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = `<style>${STYLE}</style>`;
    }
  }
  connectedCallback() {
    this.addEventListener("mousedown", this.mousedown);
  }
  disconnectedCallback() {
    this.removeEventListener("mousedown", this.mousedown);
    this._inspectorRootElement = undefined;
  }
  mousedown(e) {
    var t = this.getAttribute("area");
    const o = Config[t];
    if (o) {
      this.setAttribute("focused", "");
      const o_value = o.value;
      const n = this.getBoundingClientRect();
      const e_clientY = e.clientY;

      const r = (e) => {
        let t = e.clientY - e_clientY;

        if (!o.moveBottom) {
          t = 0 - t;
        }

        e = o_value + t;
        this.updateConfig(e, o);
      };

      const c = () => {
        this.removeAttribute("focused");
        let e = this.getBoundingClientRect().y - n.y;

        if (!o.moveBottom) {
          e = 0 - e;
        }

        var t = o_value + e;
        this.updateConfig(t, o);
        document.removeEventListener("mousemove", r);
        document.removeEventListener("mouseup", c);
      };

      document.addEventListener("mousemove", r);
      document.addEventListener("mouseup", c);
    }
  }
  updateConfig(e, t) {
    var o;

    if (this.inspectorRootElement) {
      o = 0.7 * this.inspectorRootElement.clientHeight;
      e < t.min && (e = t.min);
      t.value = e = o < e ? o : e;
      this.updateCss();
    }
  }
  updateCss() {
    for (const t in Config) {
      var e = Config[t];

      if (this.inspectorRootElement) {
        this.inspectorRootElement.style.setProperty(
          `--inspector-${t}-preview-height`,
          e.value + "px"
        );
      }
    }
  }
}
exports.default = InspectorResizePreview;

if (window && !window.customElements.get(TagName)) {
  window.customElements.define(TagName, InspectorResizePreview);
}
