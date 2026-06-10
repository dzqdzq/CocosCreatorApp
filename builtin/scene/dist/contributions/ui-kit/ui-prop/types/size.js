Object.defineProperty(exports, "__esModule", { value: true });
const dum_element_base_1 = require("../dum-element-base");

const { setElementReadonly } = require("../utils");

class Size extends dum_element_base_1.DumpElementBase {
  type = ["cc.Size"];
  $w = null;
  $h = null;
  tempValue = null;
  _listeners = ["change"];
  parseAndSetData(l, e) {
    this.tempValue = Object.assign(this.tempValue || {}, l);

    Object.keys(l).forEach((t) => {
      if (
        t &&
        t in e.value &&
        ((e.value[t] = l[t]), Reflect.has(e, "values"))
      ) {
        e.values.forEach((e) => {
          e[t] = l[t];
        });
      }
    });

    return true;
  }
  change(e, t) {
    var l;

    if (
      e.target &&
      ((l = e.target.getAttribute("local")), (e = e.target.value), l)
    ) {
      this.parseAndSetData({ [l]: e }, t);
    }
  }
  template = `
        <ui-label slot="label"></ui-label>
        <ui-num-input preci="6" label="W" slot="content" style="margin-right: 4px;" local="width"></ui-num-input>
        <ui-num-input preci="6" label="H" slot="content" local="height"></ui-num-input>
    `;
  style = "";
  mounted(e) {
    e = e.querySelectorAll("ui-num-input");

    if (e) {
      this.$w = e[0];
      this.$h = e[1];
    }
  }
  ready() {
    super.ready();
  }
  update(e) {
    super.update(e);
    const { width, height } = e.value;

    if (this.$w) {
      this.tempValue &&
      this.tempValue.width !== undefined &&
      this.tempValue.width !== width
        ? this.$w.dispatch("change")
        : (this.$w.value = width);

      this.$w.invalid = e.values && e.values.some((e) => e.width !== width);
      setElementReadonly(e, this.$w);
    }

    if (this.$h) {
      this.tempValue &&
      this.tempValue.height !== undefined &&
      this.tempValue.height !== height
        ? this.$h.dispatch("change")
        : (this.$h.value = height);

      this.$h.invalid = e.values && e.values.some((e) => e.height !== height);
      setElementReadonly(e, this.$h);
    }

    this.tempValue = null;
  }
}
exports.default = Size;
