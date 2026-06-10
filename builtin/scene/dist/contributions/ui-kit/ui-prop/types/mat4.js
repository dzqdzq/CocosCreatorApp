Object.defineProperty(exports, "__esModule", { value: true });

const { setElementReadonly } = require("../utils");

const dum_element_base_1 = require("../dum-element-base");
class Mat4 extends dum_element_base_1.DumpElementBase {
  type = ["cc.Mat4"];
  $numList = null;
  tempValue = null;
  _listeners = ["change"];
  parseAndSetData(u, t) {
    this.tempValue = Object.assign(this.tempValue || {}, u);

    Object.keys(u).forEach((e) => {
      if (
        e &&
        e in t.value &&
        ((t.value[e] = u[e]), Reflect.has(t, "values"))
      ) {
        t.values.forEach((t) => {
          t[e] = u[e];
        });
      }
    });

    return true;
  }
  change(t, e) {
    var u;

    if (
      t.target &&
      ((u = (t = t.target).getAttribute("local")), (t = Number(t.value)), u)
    ) {
      this.parseAndSetData({ [u]: t }, e);
    }
  }
  template = `
        <ui-label slot="label"></ui-label>
        <ui-num-input preci="6" slot="content" local="m00" label="m00"></ui-num-input>
        <ui-num-input preci="6" slot="content" local="m01" label="m01"></ui-num-input>
        <ui-num-input preci="6" slot="content" local="m02" label="m02"></ui-num-input>
        <ui-num-input preci="6" slot="content" local="m03" label="m03"></ui-num-input>
        <ui-num-input preci="6" slot="content" local="m04" label="m04"></ui-num-input>
        <ui-num-input preci="6" slot="content" local="m05" label="m05"></ui-num-input>
        <ui-num-input preci="6" slot="content" local="m06" label="m06"></ui-num-input>
        <ui-num-input preci="6" slot="content" local="m07" label="m07"></ui-num-input>
        <ui-num-input preci="6" slot="content" local="m08" label="m08"></ui-num-input>
        <ui-num-input preci="6" slot="content" local="m09" label="m09"></ui-num-input>
        <ui-num-input preci="6" slot="content" local="m10" label="m10"></ui-num-input>
        <ui-num-input preci="6" slot="content" local="m11" label="m11"></ui-num-input>
        <ui-num-input preci="6" slot="content" local="m12" label="m12"></ui-num-input>
        <ui-num-input preci="6" slot="content" local="m13" label="m13"></ui-num-input>
        <ui-num-input preci="6" slot="content" local="m14" label="m14"></ui-num-input>
        <ui-num-input preci="6" slot="content" local="m15" label="m15"></ui-num-input>
    `;
  style = `
        :host .content { flex-wrap: wrap; }
        :host .content::slotted(*) { flex: 0 0 calc(50% - 2px); }
        :host .content::slotted(ui-num-input:nth-child(-n+15)) { margin-bottom: 4px; }
        :host .content::slotted(ui-num-input:nth-child(even)) { margin-right: 4px; }
    `;
  mounted(t) {
    this.$numList = t.querySelectorAll("ui-num-input");
  }
  ready() {
    super.ready();
  }
  update(n) {
    super.update(n);

    if (this.$numList) {
      const n_value = n.value;

      this.$numList.forEach((t, e) => {
        const u = e < 10 ? "m0" + e : "m" + e;
        e = this.$numList ? this.$numList[e] : null;

        if (e) {
          this.tempValue &&
          this.tempValue[u] !== undefined &&
          this.tempValue[u] !== n_value[u]
            ? e.dispatch("change")
            : (e.value = n_value[u]);

          n.values && n.values.some((t) => t[u] !== n_value[u])
            ? (e.invalid = true)
            : (e.invalid = false);
        }
      });

      this.tempValue = null;

      this.$numList.forEach((t) => setElementReadonly(n, t));
    }
  }
}
exports.default = Mat4;
