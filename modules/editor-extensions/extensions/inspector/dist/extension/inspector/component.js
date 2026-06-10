Object.defineProperty(exports, "__esModule", { value: true });
exports.InspectorPropComponent = undefined;
exports.InspectorComponent = undefined;

const { deserialize } = require("../element");

const { createElement } = require("./ui");

class InspectorComponent extends HTMLElement {
  set uuids(e) {
    this._uuids = e;
    this.createTempalte();
  }
  get uuids() {
    return this._uuids;
  }
  constructor() {
    super();
    this._uuids = [];
    this.attachShadow({ mode: "open" });

    this.shadowRoot.innerHTML = `
        <style>
            :host { display: block; }
        </style>
        <slot></slot>
        `;

    this._content = this;
  }
  update() {
    this.updateTempalte(this._uuids);
  }
  async queryTemplate() {
    return await Editor.Message.request("scene", "execute-scene-script", {
      name: "inspector",
      method: "queryComponentRender",
      args: [this.uuids],
    });
  }
  async emitEvent(e, t) {
    Editor.Message.send("scene", "execute-scene-script", {
      name: "inspector",
      method: "emitComponentRenderEvent",
      args: [this.uuids, e.id, t, e.attrs],
    });
  }
  async createTempalte() {
    var e;
    var T = await this.queryTemplate();

    if (T) {
      (T = deserialize(T)).addEventListener(
        "elem-change",
        this.emitEvent.bind(this)
      );

      e = createElement(T);
      this._content.innerHTML = "";
      this._content.appendChild(e);
      this._vElem = T;
    }
  }
  async updateTempalte(e) {
    var t = await this.queryTemplate();

    if (t) {
      t = deserialize(t);
      this._vElem.apply(t);
      this._vElem.addEventListener("elem-change", this.emitEvent.bind(this));
    }
  }
}
exports.InspectorComponent = InspectorComponent;
class InspectorPropComponent extends HTMLElement {
  updateDump(e) {
    var t;
    var s;

    if (typeof e == "string") {
      t = this.shadowRoot;

      this.$prop ||
        ((s = document.createElement("ui-prop")).setAttribute("type", "dump"),
        t.appendChild(s),
        (this.$prop = s));

      this.$prop.dump = JSON.parse(e);
      this.$prop.render();

      this.$prop.dump.visible === false
        ? this.setAttribute("hidden", "")
        : this.removeAttribute("hidden");
    }
  }
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    if (this.hasAttribute("dump")) {
      setTimeout(() => {
        this.updateDump(this.getAttribute("dump") || "");
      }, 0);
    }

    this.shadowRoot.addEventListener("change-dump", () => {
      var e = this.$prop.dump;
      Editor.Message.send("scene", "set-property", {
        uuid: e.nodeUUID,
        path: e.path,
        dump: e,
      });
    });
  }
  static get observedAttributes() {
    return ["dump"];
  }
  attributeChangedCallback(e, t, s) {
    if (e === "dump") {
      this.updateDump(s);
    }
  }
}
exports.InspectorPropComponent = InspectorPropComponent;
