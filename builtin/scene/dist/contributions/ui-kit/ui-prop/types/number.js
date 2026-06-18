Object.defineProperty(exports, "__esModule", { value: true });
const dum_element_base_1 = require("../dum-element-base");

const { setElementInvalid, setElementReadonly } = require("../utils");

const tagName = { slider: "UI-SLIDER", num: "UI-NUM-INPUT" };
const toNumber = globalThis.Number;
class Number extends dum_element_base_1.DumpElementBase {
  type = ["Number", "Float", "Integer"];
  $content = null;
  _listeners = ["change"];
  parseAndSetData(n, r, e) {
    if (e && e.radian) {
      n = r.radian ? (n / Math.PI) * 180 : n;
    }

    if (r.radian) {
      n = (n / 180) * Math.PI;
    }

    r.value = n;

    if (Reflect.has(r, "values")) {
      r.values.forEach((e, t) => {
        r.values[t] = n;
      });
    }

    return true;
  }
  change(e, t) {
    if (e.target && undefined !== (e = e.target.value)) {
      this.parseAndSetData(toNumber(e), t);
    }
  }
  template = '<ui-label slot="label"></ui-label>';
  style = "";
  mounted(e) {}
  ready() {
    super.ready();
  }
  updateContent(t, n, r) {
    if (this.$parentElement) {
      let e = this.$parentElement.querySelector('[slot="content"]');

      if (e && e.tagName !== n) {
        this.$parentElement.removeChild(e);
        e = null;
      }

      if (!e) {
        (e = r()).setAttribute("slot", "content");
        this.$parentElement.appendChild(e);
      }

      var { unit: n, type: r, step, min, max, value, radian } = t;

      var n =
        (n !== undefined && e.setAttribute("unit", String(n)),
        r === "Integer" &&
          (e.setAttribute("step", "1"), e.setAttribute("preci", "0")),
        step !== undefined && e.setAttribute("step", String(t.step)),
        t.default !== undefined && e.setAttribute("default", String(t.default)),
        radian === true);

      if (min !== undefined) {
        r = n ? (180 * min) / Math.PI : min;
        e.setAttribute("min", String(r));
      }

      if (max !== undefined) {
        step = n ? (180 * max) / Math.PI : max;
        e.setAttribute("max", String(step));
      }

      if (value !== undefined) {
        t = n ? (180 * value) / Math.PI : value;
        n && (e.setAttribute("unit", "deg"), e.setAttribute("step", "1"));
        e.setAttribute("value", String(t));
      }

      return e;
    }
  }
  renderSlider(e) {
    return this.updateContent(e, tagName.slider, () =>
      document.createElement("ui-slider")
    );
  }
  renderNumberInput(e) {
    return this.updateContent(e, tagName.num, () =>
      document.createElement("ui-num-input")
    );
  }
  update(e) {
    var t;
    super.update(e);

    if (
      this.$parentElement &&
      ((t = e.slide),
      (t = t === true ? this.renderSlider(e) : this.renderNumberInput(e)))
    ) {
      this.$content = t;
      setElementInvalid(e, this.$content);
      setElementReadonly(e, this.$content);
    }
  }
}
exports.default = Number;
