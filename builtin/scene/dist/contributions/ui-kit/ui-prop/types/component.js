Object.defineProperty(exports, "__esModule", { value: true });

const { setElementReadonly } = require("../utils");

const dum_element_base_1 = require("../dum-element-base");
class Component extends dum_element_base_1.DumpElementBase {
  type = ["cc.Component"];
  $component = null;
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
        <ui-component slot="content"></ui-component>
    `;
  style = "";
  mounted(e) {
    this.$component = e.querySelector("ui-component");
  }
  ready() {
    super.ready();
  }
  update(e) {
    super.update(e);

    if (this.$parentElement && this.$component) {
      var t = this.$parentElement.getAttribute("array-type") || e.type || "";

      if (t) {
        this.$component.setAttribute("droppable", t);
      }

      const e_value = e.value;
      this.$component.value = e_value.uuid;

      if (e.values && e.values.some((e) => e.uuid !== e_value.uuid)) {
        this.$component.invalid = true;
      } else {
        this.$component.invalid = false;
      }

      setElementReadonly(e, this.$component);
    }
  }
}
exports.default = Component;
