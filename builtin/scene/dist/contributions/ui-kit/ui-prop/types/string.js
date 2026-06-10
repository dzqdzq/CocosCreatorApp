Object.defineProperty(exports, "__esModule", { value: true });
const dum_element_base_1 = require("../dum-element-base");
const utils_1 = require("../utils");

const { setElementReadonly } = utils_1;

class String extends dum_element_base_1.DumpElementBase {
  type = ["String"];
  $input = null;
  $textarea = null;
  tempValue = null;
  _listeners = ["change"];
  parseAndSetData(a, l) {
    l.value = a;
    this.tempValue = a;

    if ("values" in l) {
      l.values.forEach((e, t) => {
        l.values[t] = a;
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
        <ui-input slot="content"></ui-input>
        <ui-textarea slot="content" autoheight></ui-textarea>
    `;
  style = "";
  mounted(e) {
    this.$input = e.querySelector("ui-input");
    this.$textarea = e.querySelector("ui-textarea");
  }
  ready() {
    super.ready();
  }
  update(e) {
    super.update(e);
    var { multiline, value } = e;
    let l = null;

    if (
      (l = multiline
        ? (this.$input && (this.$input.style.display = "none"),
          this.$textarea && (this.$textarea.style.display = "block"),
          this.$textarea)
        : (this.$input && (this.$input.style.display = "flex"),
          this.$textarea && (this.$textarea.style.display = "none"),
          this.$input))
    ) {
      this.tempValue !== null && this.tempValue !== value
        ? l.dispatch("change")
        : (l.value = value);

      ((this.tempValue = null), utils_1.setElementInvalid)(e, l);
      setElementReadonly(e, l);
    }
  }
}
exports.default = String;
