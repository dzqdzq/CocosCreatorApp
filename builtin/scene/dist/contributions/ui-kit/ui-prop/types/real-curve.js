Object.defineProperty(exports, "__esModule", { value: true });
const dum_element_base_1 = require("../dum-element-base");

const defaultConfigValue = {
  xRange: [0, 1],
  yRange: [0, 1],
  precisionX: 4,
  precisionY: 4,
  showPreWrapMode: true,
  showPostWrapMode: true,
  type: "hermit",
  negative: false,
};

const ChangeToCurveRange = "change-to-curve-range";
class RealCurve extends dum_element_base_1.DumpElementBase {
  type = ["cc.RealCurve", "cc.AnimationCurve"];
  $curve = null;
  curveChangeEventBind = this.curveChangeEvent.bind(this);
  _listeners = [];
  template = `
        <ui-label slot="label"></ui-label>
        <ui-curve slot="content"></ui-curve>
    `;
  style = `
        :host .content::slotted(ui-curve) {
            height: 20px;
            border: var(--color-normal-border) 1px solid;
            box-sizing: border-box;
            background: var(--color-normal-fill-emphasis);
            cursor: pointer;
        }
    `;
  parseAndSetData(e, t) {
    e = JSON.parse(JSON.stringify(e));
    t.value = e;
    return true;
  }
  changeDumpValueToCurveValue(e) {
    if (e.radian) {
      e.multiplier = e.multiplier === 1 ? 180 : e.multiplier;
    }

    let t = [];
    return {
      keys: (t = Array.isArray(e.keyFrames)
        ? e.keyFrames.map((e) => ({
            inTangent: e.inTangent,
            outTangent: e.inTangent,
            point: { x: e.time, y: e.value },
            interpMode: e.interpMode,
            tangentWeightMode: e.tangentWeightMode,
            outTangentWeight: e.outTangentWeight,
            inTangentWeight: e.inTangentWeight,
          }))
        : t),
      postWrapMode: e.postExtrap,
      preWrapMode: e.preExtrap,
      multiplier: e.multiplier,
    };
  }
  changeCurveValueToDumpValue(e) {
    if (e.radian) {
      e.multiplier = e.multiplier || 1;
    }

    let t = [];

    if (Array.isArray(e.keys)) {
      t = e.keys.map((e) => ({
        inTangent: e.inTangent,
        outTangent: e.inTangent,
        time: e.point.x,
        value: e.point.y,
        interpMode: e.interpMode,
        tangentWeightMode: e.tangentWeightMode,
        outTangentWeight: e.outTangentWeight,
        inTangentWeight: e.inTangentWeight,
      }));
    }

    return {
      postExtrap: e.postWrapMode,
      preExtrap: e.preWrapMode,
      keyFrames: t,
      multiplier: e.multiplier,
    };
  }
  curveChangeEvent(e) {
    e.stopPropagation();
    e.preventDefault();
    var t = this.$parentElement.dump;
    var e = e.target.value;

    if (t && e && this.$parentElement) {
      e.keys.sort((e, t) => e.point.x - t.point.x);
      t.value = this.changeCurveValueToDumpValue(e);

      this.$parentElement.hasAttribute(ChangeToCurveRange)
        ? this.$parentElement.dispatch(ChangeToCurveRange, {
            detail: { value: e, path: t.path, type: t.type },
          })
        : this.$parentElement.dispatch("change");
    }
  }
  mounted(e) {
    this.$curve = e.querySelector("ui-curve");
  }
  ready() {
    super.ready();

    if (this.$curve) {
      this.$curve.addEventListener("change", this.curveChangeEventBind);
    }
  }
  update(t) {
    super.update(t);

    if (this.$curve && this.$parentElement) {
      var n = JSON.parse(JSON.stringify(defaultConfigValue));
      let e = false;

      if (this.$parentElement.hasAttribute(ChangeToCurveRange)) {
        n.yRange = [t.value.min ?? -1, t.value.max ?? 1];
        (t.value.min !== undefined && t.value.min !== null) || (e = true);
      } else {
        n.yRange = [t.min ?? -1, t.max ?? 1];
        (t.min !== undefined && t.min !== null) || (e = true);
      }

      n.negative = !(n.yRange[0] >= 0 && e === false);
      this.$curve._config = n;
      this.$curve.setAttribute("label", t.displayName || t.name || "");
      this.$curve.value = this.changeDumpValueToCurveValue(t.value);
    }
  }
  close() {
    super.close();

    if (this.$curve) {
      this.$curve.removeEventListener("change", this.curveChangeEventBind);
    }
  }
}
exports.default = RealCurve;
