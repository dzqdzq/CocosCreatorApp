Object.defineProperty(exports, "__esModule", { value: true });
const dum_element_base_1 = require("../dum-element-base");

const modeTransformMap = {
  "0 -> 3": ["constant", "constantMin"],
  "3 -> 0": ["constantMin", "constant"],
  "1 -> 2": ["spline", "splineMin"],
  "2 -> 1": ["splineMin", "spline"],
};

const ChangeToCurveRange = "change-to-curve-range";
class CurveRange extends dum_element_base_1.DumpElementBase {
  type = ["cc.CurveRange"];
  $section = null;
  $icon = null;
  _listeners = [];
  template = `
        <ui-label slot="label"></ui-label>
        <section slot="content" style="--ui-prop-label-width-min: 90px;"></section>
        <ui-icon value="arrow-triangle" slot="content" style="flex: none;"></ui-icon>
    `;
  style = "";
  parseAndSetData(e, a) {
    var e = JSON.parse(JSON.stringify(e));

    var {
      constant: a,
      constantMax,
      constantMin,
      spline,
      splineMin,
      splineMax,
      mode,
    } = a.value;

    a.value = e.constant.value;
    constantMax.value = e.constantMax.value;
    constantMin.value = e.constantMin.value;
    mode.value = e.mode.value;

    spline.value = {
      ...e.spline.value,
      keyFrames: e.spline.value.keyFrames.map((e) => e),
    };

    splineMin.value = {
      ...e.splineMin.value,
      keyFrames: e.splineMin.value.keyFrames.map((e) => e),
    };

    splineMax.value = {
      ...e.splineMax.value,
      keyFrames: e.splineMax.value.keyFrames.map((e) => e),
    };

    return true;
  }
  updateProps(a) {
    if (this.$section && this.$icon) {
      if (
        a.values &&
        a.values.some((e) => e.mode.value !== a.value.mode.value)
      ) {
        this.$section.innerHTML = "Cannot edit different types";
      } else {
        var e = {
          min: a.min,
          max: a.max,
          radian: a.radian,
          multiplier: a.value.multiplier.value,
        };

        var n = {
          multiplier: a.value.multiplier.value,
          min: a.min ?? Number.NEGATIVE_INFINITY,
          max: a.max ?? Number.POSITIVE_INFINITY,
          radian: a.radian,
        };

        var t = Array.from(this.$section.children);

        if (!t.length) {
          this.$section.innerHTML = "";
        }

        switch (a.value.mode.value) {
          case 0: {
            Object.assign(a.value.constant, n);
            this.renderPropData(a.value.constant, t[0], false);

            if (t[1]) {
              this.$section.removeChild(t[1]);
            }

            break;
          }
          case 1: {
            Object.assign(a.value.spline.value || {}, e, {
              multiplier: a.value.multiplier.value,
              type: "curve",
            });
            var i = this.renderPropData(a.value.spline, t[0], false);
            this.bindEventListener(i, a.value.spline.path);

            if (t[1]) {
              this.$section.removeChild(t[1]);
            }

            break;
          }
          case 2: {
            Object.assign(a.value.splineMin.value || {}, e);
            Object.assign(a.value.splineMax.value || {}, e);
            var i = this.renderPropData(a.value.splineMin, t[0], true);
            var l = this.renderPropData(a.value.splineMax, t[1], true);

            if (l) {
              l.style.marginTop = "4px";
            }

            this.bindEventListener(i, a.value.splineMin.path);
            this.bindEventListener(l, a.value.splineMax.path);
            break;
          }
          case 3: {
            Object.assign(a.value.constantMin, n);
            Object.assign(a.value.constantMax, n);
            this.renderPropData(a.value.constantMin, t[0], true);
            i = this.renderPropData(a.value.constantMax, t[1], true);

            if (i) {
              i.style.marginTop = "4px";
            }
          }
        }
      }
    }
  }
  renderPropData(e, a, n) {
    if (this.$section) {
      if (!a) {
        (a = document.createElement("ui-prop")).setAttribute("type", "dump");
        a.setAttribute(ChangeToCurveRange, "");
        this.$section.appendChild(a);
      }

      if (n) {
        a.removeAttribute("no-label");
      } else {
        a.setAttribute("no-label", "");
      }

      a.render(e);
      return a;
    }
  }
  bindEventListener(e, a) {
    if (e && this.$parentElement && !e.__bind) {
      e.addEventListener(ChangeToCurveRange, (e) => {
        if (this.$parentElement) {
          const n = this.$parentElement.dump;
          var a = e.detail.value;
          n.value.multiplier.value = a.multiplier;

          if (n.values) {
            n.values.forEach((e, a) => {
              if (a !== 0) {
                n.values[a] = JSON.parse(JSON.stringify(n.value));
              }
            });
          }

          e.stopPropagation();
          e.preventDefault();
          this.$parentElement.dispatch("change");
        }
      });

      e.__bind = true;
    }
  }
  mounted(e) {
    this.$section = e.querySelector("section");
    this.$icon = e.querySelector("ui-icon");
  }
  ready() {
    super.ready();

    if (this.$icon && this.$parentElement) {
      this.$icon.addEventListener("click", () => {
        if (this.$parentElement) {
          const t = this.$parentElement.dump;
          if (t) {
            const i = this;
            Editor.Menu.popup({
              menu: t.value.mode.enumList.map((n) => ({
                label: n.name,
                type: "radio",
                enabled: !t.readonly,
                checked: n.value === t.value.mode.value,

                click() {
                  const a =
                    modeTransformMap[t.value.mode.value + " -> " + n.value];
                  t.value.mode.value = n.value;

                  if (a) {
                    t.value[a[1]].value = t.value[a[0]].value;
                  }

                  if ("values" in t) {
                    t.values.forEach((e) => {
                      e.mode.value = n.value;

                      if (a) {
                        e[a[1]].value = e[a[0]].value;
                      }
                    });

                    t.value.mode.values = t.value.mode.values.map(
                      (e) => n.value
                    );
                  }

                  if (i.$icon) {
                    i.$icon.dump = t.value.mode;
                  }

                  i.updateProps(t);
                  var e = new Event("change-dump", {
                    bubbles: true,
                    cancelable: true,
                  });

                  if (a && i.$section) {
                    Array.from(
                      i.$section.querySelectorAll("ui-prop")
                    )[0].dispatchEvent(e);
                  }

                  if (i.$icon) {
                    i.$icon.dispatchEvent(e);
                  }
                },
              })),
            });
          }
        }
      });
    }
  }
  update(e) {
    super.update(e);
    this.updateProps(e);
  }
}
exports.default = CurveRange;
