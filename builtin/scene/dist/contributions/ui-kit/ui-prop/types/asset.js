Object.defineProperty(exports, "__esModule", { value: true });

const { setElementReadonly } = require("../utils");

const dum_element_base_1 = require("../dum-element-base");
class Asset extends dum_element_base_1.DumpElementBase {
  type = ["cc.Asset"];
  $asset = null;
  _listeners = ["change"];
  parseAndSetData(t, e) {
    e.value.uuid = t.uuid;

    if (Reflect.has(e, "values")) {
      e.values.forEach((e) => {
        e.uuid = t.uuid;
      });
    }

    return true;
  }
  change(e, t) {
    if (e.target && undefined !== (e = e.target.value)) {
      this.parseAndSetData({ uuid: e }, t);
    }
  }
  template = `
        <ui-label slot="label"></ui-label>
        <ui-asset slot="content"></ui-asset>
    `;
  style = "";
  mounted(e) {
    this.$asset = e.querySelector("ui-asset");
  }
  ready() {
    super.ready();
  }
  update(e) {
    super.update(e);

    if (this.$parentElement && this.$asset) {
      var t = this.$parentElement.getAttribute("array-type") || e.type || "";

      if (t) {
        this.$asset.setAttribute("droppable", t);
      }

      if (e.default !== undefined) {
        this.$asset.setAttribute("default", String(e.default));
      }

      const e_value = e.value;
      this.$asset.value = e_value.uuid;

      if (e.values && e.values.some((e) => e.uuid !== e_value.uuid)) {
        this.$asset.invalid = true;
      } else {
        this.$asset.invalid = false;
      }

      setElementReadonly(e, this.$asset);
    }
  }
}
exports.default = Asset;
