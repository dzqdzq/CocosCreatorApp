Object.defineProperty(exports, "__esModule", { value: true });

const { setVecInput } = require("../utils");

const dum_element_base_1 = require("../dum-element-base");
class Vec2 extends dum_element_base_1.DumpElementBase {
  type = ["cc.Vec2"];
  $x = null;
  $y = null;
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
        <ui-num-input preci="6" label="X" slot="content" style="margin-right: 4px;" local="x"></ui-num-input>
        <ui-num-input preci="6" label="Y" slot="content" local="y"></ui-num-input>
    `;
  style = "";
  mounted(e) {
    e = e.querySelectorAll("ui-num-input");

    if (e) {
      this.$x = e[0];
      this.$y = e[1];
    }
  }
  ready() {
    super.ready();
  }
  setValue(e, t, l) {
    var u = l.value[t];
    var t = this.tempValue ? this.tempValue[t] : undefined;

    if (t !== undefined && u !== undefined && t !== u) {
      e.dispatch("change");
    } else {
      setVecInput(l, e);
    }
  }
  update(e) {
    super.update(e);

    if (this.$x) {
      this.setValue(this.$x, "x", e);
    }

    if (this.$y) {
      this.setValue(this.$y, "y", e);
    }

    this.tempValue = null;
  }
}
exports.default = Vec2;
