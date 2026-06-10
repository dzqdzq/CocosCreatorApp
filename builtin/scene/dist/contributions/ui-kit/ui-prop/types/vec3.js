Object.defineProperty(exports, "__esModule", { value: true });

const { setVecInput } = require("../utils");

const dum_element_base_1 = require("../dum-element-base");
class Vec3 extends dum_element_base_1.DumpElementBase {
  type = ["cc.Vec3"];
  tempValue = null;
  _listeners = ["change"];
  parseAndSetData(i, t) {
    this.tempValue = Object.assign(this.tempValue || {}, i);

    Object.keys(i).forEach((e) => {
      if (
        e &&
        e in t.value &&
        ((t.value[e] = i[e]), Reflect.has(t, "values"))
      ) {
        t.values.forEach((t) => {
          t[e] = i[e];
        });
      }
    });

    return true;
  }
  change(t, e) {
    var i;

    if (
      t.target &&
      ((i = t.target.getAttribute("local")), (t = t.target.value), i)
    ) {
      this.parseAndSetData({ [i]: t }, e);
    }
  }
  $x = null;
  $y = null;
  $z = null;
  $icon = null;
  template = `
        <ui-label slot="label"></ui-label>
        <ui-icon slot="label" value="warn-triangle" hidden></ui-icon>
        <ui-num-input preci="6" label="X" slot="content" local="x"></ui-num-input>
        <ui-num-input preci="6" label="Y" slot="content" local="y"></ui-num-input>
        <ui-num-input preci="6" label="Z" slot="content" local="z"></ui-num-input>`;
  style = `
        ::slotted(ui-icon) { 
            color: var(--color-warn-fill);
            position: absolute;
            left: -20px;
        }
        ::slotted(ui-num-input[warn]) { opacity: .55; }

        ::slotted(ui-num-input:not(:first-of-type)){
            margin-left: 4px;
        }
        ::slotted(ui-num-input[no-margin]){
            margin-left: 0;
        }`;
  mounted(t) {
    this.$icon = t.querySelector("ui-icon");
    t = t.querySelectorAll("ui-num-input");

    if (t) {
      this.$x = t[0];
      this.$y = t[1];
      this.$z = t[2];
    }
  }
  ready() {
    super.ready();
  }
  _hasAttribute(t, e) {
    return !!t && t.hasAttribute(e);
  }
  setValue(t, e, i) {
    var u = i.value[e];
    var e = this.tempValue ? this.tempValue[e] : undefined;

    if (e !== undefined && u !== undefined && e !== u) {
      t.dispatch("change");
    } else {
      setVecInput(i, t);
    }
  }
  update(t) {
    super.update(t);

    if (this.$x) {
      this.setValue(this.$x, "x", t);
    }

    if (this.$y) {
      this.setValue(this.$y, "y", t);
    }

    if (this.$z) {
      this.setValue(this.$z, "z", t);
    }

    this.tempValue = null;
    const { lock, value } = t;

    if (
      lock &&
      this._hasAttribute(this.$x, "hidden") &&
      this._hasAttribute(this.$y, "hidden")
    ) {
      if (this.$z) {
        this.$z.setAttribute("no-margin", "");
      }
    } else if (this.$z) {
      this.$z.removeAttribute("no-margin");
    }

    if (this.$icon) {
      if (!lock) {
        return this.$icon.setAttribute("hidden", "");
      }
      let u = "";

      Object.keys(lock).forEach((t) => {
        var e = t;
        var i = value ? value[e] : null;
        var e = lock[e];

        if (e && e.default !== i) {
          i = Editor.I18n.t(e.message.replace("i18n:", ""));

          u +=
            t.toUpperCase() +
            `: ${i} 
`;
        }
      });

      if (u) {
        this.$icon.removeAttribute("hidden");
        this.$icon.setAttribute("tooltip", u);
      }
    }
  }
}
exports.default = Vec3;
