Object.defineProperty(exports, "__esModule", { value: true });
exports.element = undefined;

const { getMessageProtocolScene } = require("./utils");

class element extends Editor.UI.__protected__.DragObject {
  _nodeInfo = null;
  missStateShowText = "Missing Node";
  selectIconValue = "drag-node";
  constructor() {
    super();

    if (this.shadowRoot) {
      this.shadowRoot.querySelector("#custom-style").innerHTML =
        ".type ui-icon { color: var(--color-success-fill-normal); }";
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
  get nodeInfo() {
    return this._nodeInfo;
  }
  _onAreaClick() {
    Editor.Message.broadcast("ui-kit:touch-node", this.$root.value);
  }
  _onSelectClick() {
    if (!this.$root.disabled && !this.$root.readonly) {
      Date.now();

      Editor.Panel.__protected__.openKit("ui-kit.searcher", {
        elem: this.$root,
        params: [
          {
            type: "node",
            value: this.$root.value,
            droppable: "cc.Node",
            filterOptions: this.$root.filter,
          },
        ],
        listeners: {
          confirm: (e) => {
            if (e) {
              this.$root.value = e.value;
              this.$root._nodeInfo = e.info;
              this.$root.dispatch("confirm");
            }
          },
          change: (e) => {
            if (e) {
              this.$root.value = e.value;
              this.$root._nodeInfo = e.info;
              this.$root.dispatch("change");
            }
          },
          cancel: (e) => {
            if (e) {
              this.$root.value = e.value;
              this.$root._nodeInfo = e.info;
              this.$root.dispatch("cancel");
            }
          },
        },
      });
    }
  }
  async _onTranslationName(e) {
    if (e) {
      e = await Editor.Message.request(
        getMessageProtocolScene(this),
        "query-node",
        e
      );
      if (e && e.name) {
        return e.name.value;
      }
    }
    return null;
  }
}
exports.element = element;
