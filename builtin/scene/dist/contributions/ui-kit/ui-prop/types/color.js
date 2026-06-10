Object.defineProperty(exports, "__esModule", { value: true });

const { setElementReadonly } = require("../utils");

const dum_element_base_1 = require("../dum-element-base");
class Color extends dum_element_base_1.DumpElementBase {
  type = ["cc.Color"];
  $color = null;
  _listeners = ["change", "cancel"];
  parseAndSetData(e, l) {
    const { r: r_1, g, b, a } = e;
    l.value.r = Number(r_1);
    l.value.g = Number(g);
    l.value.b = Number(b);
    l.value.a = Number(a);

    if (Reflect.has(l, "values")) {
      l.values.forEach((e) => {
        e.r = r_1;
        e.g = g;
        e.b = b;
        e.a = a;
      });
    }

    return true;
  }
  change(e, l) {
    var a;
    var t;
    var r;
    var s;

    if (e.target && (e = e.target.value) && (([a, t, r, s] = e), e)) {
      this.parseAndSetData({ r: a, g: t, b: r, a: s }, l);
    }
  }
  cancel(e, l) {
    this.change(e, l);
  }
  template = `
        <ui-label slot="label"></ui-label>
        <ui-color slot="content"></ui-color>
    `;
  style = "";
  mounted(e) {
    this.$color = e.querySelector("ui-color");
  }
  ready() {
    super.ready();
  }
  update(e) {
    super.update(e);

    if (this.$color) {
      const e_value = e.value;
      this.$color.value = JSON.stringify([
        e_value.r,
        e_value.g,
        e_value.b,
        e_value.a,
      ]);

      if (
        e.values &&
        e.values.some(
          (e) =>
            e.r !== e_value.r ||
            e.g !== e_value.g ||
            e.b !== e_value.b ||
            e.a !== e_value.a
        )
      ) {
        this.$color.invalid = true;
      } else {
        this.$color.invalid = false;
      }

      setElementReadonly(e, this.$color);
    }
  }
}
exports.default = Color;
