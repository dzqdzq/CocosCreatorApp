Object.defineProperty(exports, "__esModule", { value: true });
exports.element = undefined;

const { basename } = require("path");

class element extends Editor.UI.__protected__.DragObject {
  missStateShowText = "Missing Asset";
  selectIconValue = "drag-asset";
  constructor() {
    super();

    if (this.shadowRoot) {
      this.shadowRoot.querySelector("#custom-style").innerHTML =
        ".type ui-icon { color: var(--color-primary-fill-normal); }";
    }
  }
  get filter() {
    try {
      return JSON.parse(this.getAttribute("filter"));
    } catch (e) {
      console.error(e);
    }
    return null;
  }
  set filter(e) {
    if (typeof e == "object") {
      this.setAttribute("filter", JSON.stringify(e));
    } else {
      this.setAttribute("filter", e);
    }
  }
  _onAreaClick() {
    Editor.Message.broadcast("ui-kit:touch-asset", this.$root.value);
  }
  _onSelectClick() {
    var e;

    if (!this.$root.disabled && !this.$root.readonly) {
      Date.now();
      e = this.$root.filter;

      Editor.Panel.__protected__.openKit("ui-kit.searcher", {
        elem: this.$root,
        params: [
          {
            type: "asset",
            value: this.$root.value,
            droppable: e ? undefined : this.$root.droppable,
            assetFilter: e,
          },
        ],
        listeners: {
          confirm: (e) => {
            if (e) {
              this.$root.value = e.value;
              this.$root.dispatch("confirm");
            }
          },
          change: (e) => {
            if (e) {
              this.$root.value = e.value;
              this.$root.dispatch("change");
            }
          },
          preview: (e) => {
            if (e) {
              this.$root.dispatch("preview", { detail: e });
            }
          },
        },
      });
    }
  }
  async _onTranslationName(e) {
    let t = null;
    let r = true;
    if (e) {
      const s = await Editor.Message.request("asset-db", "query-asset-info", e);

      if (
        s &&
        ((t = s.source ? basename(s.source) : s.displayName || s.name),
        (e = this._droppable.split(",").filter(Boolean)),
        (r = e.includes(s.type)),
        s.extends) &&
        s.extends.length
      ) {
        e.forEach((e) => {
          if (s.extends && s.extends.includes(e)) {
            r = true;
          }
        });
      }
    }

    if (r) {
      this.removeAttribute("error");
    } else {
      this.setAttribute("error", true);
    }

    return t;
  }
}
exports.element = element;
