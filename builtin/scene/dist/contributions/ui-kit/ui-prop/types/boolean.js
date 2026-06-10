Object.defineProperty(exports, "__esModule", { value: true });
const dum_element_base_1 = require("../dum-element-base");

const { setElementReadonly, setElementInvalid } = require("../utils");

class Boolean extends dum_element_base_1.DumpElementBase {
  type = ["Boolean"];
  $checkbox = null;
  _listeners = ["change"];
  parseAndSetData(l, a) {
    a.value = l;

    if (Reflect.has(a, "values")) {
      a.values.forEach((e, t) => {
        a.values[t] = l;
      });
    }

    return true;
  }
  change(e, t) {
    if (e.target && undefined !== (e = e.target.value)) {
      this.parseAndSetData(e, t);
    }
  }
  template = `
        <ui-label slot="label"></ui-label>
        <ui-checkbox slot="content"></ui-checkbox>
    `;
  style = "";
  mounted(e) {
    this.$checkbox = e.querySelector("ui-checkbox");
  }
  ready() {
    super.ready();
  }
  update(e) {
    super.update(e);

    if (this.$checkbox) {
      this.$checkbox.value = e.value;
      setElementReadonly(e, this.$checkbox);
      setElementInvalid(e, this.$checkbox);
    }
  }
}
exports.default = Boolean;
