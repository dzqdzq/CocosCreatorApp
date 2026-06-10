Object.defineProperty(exports, "__esModule", { value: true });

const { setElementReadonly } = require("../utils");

const dum_element_base_1 = require("../dum-element-base");
class Rect extends dum_element_base_1.DumpElementBase {
  type = ["cc.Rect"];
  $x = null;
  $y = null;
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
        <ui-num-input preci="6" label="X" slot="content" local="x"></ui-num-input>
        <ui-num-input preci="6" label="Y" slot="content" local="y"></ui-num-input>
        <ui-num-input preci="6" label="W" slot="content" local="width"></ui-num-input>
        <ui-num-input preci="6" label="H" slot="content" local="height"></ui-num-input>
    `;
  style = `
        :host .content { flex-wrap: wrap; }
        :host .content::slotted(*) { flex: 0 0 calc(50% - 2px); }
        :host .content::slotted(ui-num-input:nth-child(-n+3)) { margin-bottom: 4px; }
        :host .content::slotted(ui-num-input:nth-child(even)) { margin-right: 4px; }
    `;
  mounted(e) {
    e = e.querySelectorAll("ui-num-input");

    if (e) {
      this.$x = e[0];
      this.$y = e[1];
      this.$w = e[2];
      this.$h = e[3];
    }
  }
  ready() {
    super.ready();
  }
  setValue(e, t, l) {
    if (
      this.tempValue &&
      this.tempValue[t] !== undefined &&
      this.tempValue[t] !== l
    ) {
      e.dispatch("change");
    } else {
      e.value = l;
    }
  }
  update(e) {
    super.update(e);
    const { x, y, width, height } = e.value;

    if (this.$x) {
      this.setValue(this.$x, "x", x);
      this.$x.invalid = e.values && e.values.some((e) => e.x !== x);
      setElementReadonly(e, this.$x);
    }

    if (this.$y) {
      this.setValue(this.$y, "y", y);
      this.$y.invalid = e.values && e.values.some((e) => e.y !== y);
      setElementReadonly(e, this.$y);
    }

    if (this.$w) {
      this.setValue(this.$w, "w", width);
      this.$w.invalid = e.values && e.values.some((e) => e.width !== width);
      setElementReadonly(e, this.$w);
    }

    if (this.$h) {
      this.setValue(this.$h, "h", height);
      this.$h.invalid = e.values && e.values.some((e) => e.height !== height);
      setElementReadonly(e, this.$h);
    }

    this.tempValue = null;
  }
}
exports.default = Rect;
