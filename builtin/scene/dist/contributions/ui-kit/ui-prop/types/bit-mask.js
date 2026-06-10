Object.defineProperty(exports, "__esModule", { value: true });
const dum_element_base_1 = require("../dum-element-base");

const { setElementReadonly, setElementInvalid } = require("../utils");

class BitMask extends dum_element_base_1.DumpElementBase {
  type = ["BitMask"];
  $selectPro = null;
  list = [];
  _listeners = ["change"];
  parseAndSetData(s, l) {
    l.value = s;

    if (Reflect.has(l, "values")) {
      l.values.forEach((e, t) => {
        l.values[t] = s;
      });
    }

    return true;
  }
  change(e, t) {
    e.stopPropagation();
    e.preventDefault();

    if (e.detail) {
      e = (e.detail || []).reduce((e, t) => e ^ t, 0);
      this.parseAndSetData(e, t);
    }
  }
  template = `
        <ui-label slot="label"></ui-label>
        <ui-select-pro slot="content" multiple type="checkbox"></ui-select-pro>
    `;
  style = "";
  mounted(e) {
    this.$selectPro = e.querySelector("ui-select-pro");
  }
  ready() {
    super.ready();
  }
  createSelectOptions(e) {
    var t;
    var s = e.bitmaskList || [];

    this.list = s.map((e) => e.value);

    if (this.$selectPro) {
      this.$selectPro.innerHTML = "";
      for (const l of s) {
        if (l.value !== 0 && l.value !== 4294967295) {
          (t = document.createElement("ui-select-option-pro")).setAttribute(
            "value",
            l.value
          );

          t.setAttribute("label", l.name);
          0 != (l.value & Number(e.value)) && t.setAttribute("selected", "");
          this.$selectPro.appendChild(t);
        }
      }
    }
  }
  update(e) {
    var t;
    var s;
    var l;
    super.update(e);

    if (this.$selectPro) {
      (this.list &&
        ((t = (e.bitmaskList || []).length === this.list.length),
        (s = (e.bitmaskList || []).every((e) => this.list.includes(e.value))),
        (l = this.$selectPro.value.reduce((e, t) => e ^ t, 0)),
        t) &&
        s &&
        l === e.value) ||
        this.createSelectOptions(e);

      setElementReadonly(e, this.$selectPro);
      setElementInvalid(e, this.$selectPro);
    }
  }
}
exports.default = BitMask;
