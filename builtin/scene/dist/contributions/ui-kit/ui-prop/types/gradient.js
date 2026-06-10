Object.defineProperty(exports, "__esModule", { value: true });
const dum_element_base_1 = require("../dum-element-base");
const Chroma = require("chroma-js");
class Gradient extends dum_element_base_1.DumpElementBase {
  type = ["cc.Gradient"];
  $gradient = null;
  _listeners = ["change", "cancel"];
  parseAndSetData(a, e, r) {
    if (r && r.value.mode) {
      a.mode = r.value.mode;
    }

    e.value.alphaKeys = a.alphaKeys;
    e.value.colorKeys = a.colorKeys;

    if (e.values) {
      e.values.forEach((e) => {
        e.alphaKeys = a.alphaKeys;
        e.colorKeys = a.colorKeys;
      });
    }

    return true;
  }
  change(e, a) {
    var r;

    if (e.target && undefined !== (e = e.target.value)) {
      ({ alpha: e, color: r } = e);

      e = (e || []).map((e) => ({
        time: e.progress,
        alpha: Math.round(255 * e.value),
      }));

      r = (r || []).map((e) => {
        let a;
        try {
          a = Chroma(e.value).rgb();
        } catch (e) {
          a = [255, 255, 255];
        }
        return { time: e.progress, color: a };
      });

      this.parseAndSetData({ alphaKeys: e, colorKeys: r }, a);
    }
  }
  cancel(e, a) {
    this.change(e, a);
  }
  template = `
        <ui-label slot="label"></ui-label>
        <ui-gradient slot="content"></ui-gradient>
    `;
  style = "";
  mounted(e) {
    this.$gradient = e.querySelector("ui-gradient");
  }
  ready() {
    super.ready();
  }
  update(e) {
    var a;
    super.update(e);

    if (this.$gradient) {
      a = (e.value.alphaKeys || []).map((e) => {
        if (e.time === undefined) {
          e.time = 0;
        }

        if (e.alpha === undefined) {
          e.alpha = 255;
        }

        return { progress: e.time, value: e.alpha / 255 };
      });

      e = (e.value.colorKeys || []).map((e) => {
        if (e.time === undefined) {
          e.time = 0;
        }

        if (e.color === undefined) {
          e.color = [255, 255, 255];
        }

        let a = "";
        try {
          a = Chroma(e.color).hex();
        } catch (e) {
          a = "#ffffff";
        }
        return { progress: e.time, value: a };
      });

      this.$gradient.value = { color: e, alpha: a };
    }
  }
}
exports.default = Gradient;
