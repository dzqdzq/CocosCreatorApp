var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorAnimationAuxCurve = undefined;
exports.syncToRealCurve = syncToRealCurve;
exports.createEditorCurve = createEditorCurve;
const cc_1 = require("cc");

const editor_animation_curve_base_1 = __importDefault(
  require("./editor-animation-curve-base")
);

const utils_1 = require("./utils");
const dump_1 = __importDefault(require("../../../export/dump"));
function syncToRealCurve(e, t) {
  const a = e.getClipSample();
  var r = e.keyframeData.map((e) => [
    e.frame / a,
    {
      value: e.value,
      interpolationMode: e.interpMode,
      leftTangent: e.inTangent,
      rightTangent: e.outTangent,
      leftTangentWeight: e.inTangentWeight,
      rightTangentWeight: e.outTangentWeight,
      tangentWeightMode: e.tangentWeightMode,
    },
  ]);
  t.assignSorted(r);
  t.preExtrapolation = e.preExtrap;
  t.postExtrapolation = e.postExtrap;
  return t;
}
function createEditorCurve(e, t, a, r) {
  return EditorAnimationAuxCurve.create(e, t, a, r);
}
class EditorAnimationAuxCurve extends editor_animation_curve_base_1.default {
  constructor(e, t) {
    super();
    this._node = e;
    this._clipData = t;
  }
  static create(e, t, a, r) {
    a = new EditorAnimationAuxCurve(a, r);

    a.initFromCurve(
      {
        displayName: e,
        nodePath: "",
        propKey: "",
        propName: e,
        targetPaths: new cc_1.animation.TrackPath(),
        type: { value: "Float" },
      },
      t
    );

    return a;
  }
  get targetPaths() {
    return this._curveInfo.targetPaths;
  }
  get displayName() {
    return this._curveInfo.displayName;
  }
  async getDumpData() {
    var e = utils_1.utils.dumpKeyframeData(this._keyframeData);
    var t = this._curveInfo.type?.value;
    var t = utils_1.utils.isTypeSupportCurve(t);
    return {
      nodePath: "",
      keyframes: e,
      displayName: this.displayName,
      key: this.displayName,
      type: this._curveInfo.type,
      preExtrap: this.preExtrap,
      postExtrap: this.postExtrap,
      isCurveSupport: t,
    };
  }
  getCompName() {
    return this._curveInfo.compName;
  }
  getPropName() {
    return this._curveInfo.propName;
  }
  changeNodePath(e) {
    throw new Error("Method not supported.");
  }
  queryKeyIndex(t) {
    if (this._keyframeData) {
      for (let e = 0; e < this._keyframeData.length; e++) {
        if (this._keyframeData[e].frame === t) {
          return e;
        }
      }
    }
    return -1;
  }
  queryKeyframe(t) {
    if (this._keyframeData) {
      for (let e = 0; e < this._keyframeData.length; e++) {
        var a = this._keyframeData[e];
        if (a.frame === t) {
          return a;
        }
      }
    }
    return null;
  }
  getValidKeys(t) {
    if (!this._keyframeData) {
      return null;
    }
    var a = [];
    for (let e = 0; e < this._keyframeData.length; e++) {
      var r = this._keyframeData[e].frame;

      if (t.includes(r)) {
        a.push(r);
      }
    }
    return a;
  }
  hasKey(e) {
    return this.queryKeyframe(e) !== null;
  }
  async createKey(t = 0, a) {
    var r = this.propData;
    let i;
    i =
      a?.newValue !== undefined
        ? a?.newValue
        : (({ curve: e, sample: n } = this._getMockCurve()), e.evaluate(t / n));
    var e = this.queryKeyframe(t);
    if (e) {
      e.value = i;

      if (a) {
        utils_1.utils.copyCurveData(a, e);
      }
    } else {
      let e = 0;
      for (
        e = 0;
        e < this._keyframeData.length && !(this._keyframeData[e].frame > t);
        e++
      ) {}
      var n = {
        frame: t,
        value: i,
        interpMode: cc_1.RealInterpolationMode.LINEAR,
      };

      if (utils_1.utils.isTypeSupportCurve(r.type?.value)) {
        n.inTangent = 0;
        n.inTangentWeight = 1;
        n.outTangent = 0;
        n.outTangentWeight = 1;
        n.tangentWeightMode = cc_1.TangentWeightMode.NONE;
        n.tangentMode = 0;
      }

      if (a) {
        utils_1.utils.copyCurveData(a, n);
      }

      this._keyframeData.splice(e, 0, n);
      this._isDirty = true;
    }
    return true;
  }
  async moveKeys(t, n) {
    if (!this._keyframeData) {
      return false;
    }
    var s = [];
    for (let e = 0; e < t.length; e++) {
      var a = t[e];
      var a = this.queryKeyIndex(a);
      if (a < 0) {
        return false;
      }
      s.push(this._keyframeData[a]);
      this._keyframeData.splice(a, 1);
    }
    for (let e = 0; e < s.length; e++) {
      var u = s[e];
      let t = u.frame + n[e];

      if (t < 0) {
        t = 0;
      }

      let a = 0;
      let r = false;
      let i = false;
      if (this._keyframeData.length > 0) {
        for (let e = 0; e < this._keyframeData.length; e++) {
          var o = this._keyframeData[e].frame;
          if (o >= t) {
            a = e;
            r = true;

            if (o === t) {
              i = true;
            }

            break;
          }
        }

        if (!r) {
          if (t <= this._keyframeData[0].frame) {
            a = 0;
          } else if (
            t > this._keyframeData[this._keyframeData.length - 1].frame
          ) {
            a = this._keyframeData.length;
          }
        }
      }
      var l = i ? 1 : 0;
      var h = { frame: t, value: u.value };
      utils_1.utils.copyCurveData(u, h);
      this._keyframeData.splice(a, l, h);
    }
    return (this._isDirty = true);
  }
  async removeKey(e) {
    e.forEach((e) => {
      e = this.queryKeyIndex(e);

      if (e >= 0) {
        this._keyframeData.splice(e, 1);
      }
    });

    this._isDirty = true;
    return this._isDirty;
  }
  async updateKey(t) {
    for (let e = 0; e < t.length; e++) {
      var a = t[e];
      if (!this.queryKeyframe(a)) {
        return false;
      }
    }
    return (this._isDirty = true);
  }
  async copyKeysTo(t, a) {
    for (let e = 0; e < t.length; e++) {
      var r;
      var i = t[e];
      var n = this.queryKeyframe(i);

      if (n) {
        r = { newValue: n.value };
        utils_1.utils.copyCurveData(n, r);
        await this.createKey(a + i - t[0], r);
      }
    }
    return (this._isDirty = true);
  }
  async spacingKeys(t, a) {
    if (t.length > 1) {
      t.sort((e, t) => e - t);
      var [r] = t;
      var i = [];
      var n = [];
      for (let e = 1; e < t.length; e++) {
        i.push(t[e]);
        n.push(r + e * a - t[e]);
      }
      this.moveKeys(i, n);
      this._isDirty = true;
      return this._isDirty;
    }
    return false;
  }
  async clearKeys() {
    this._keyframeData = [];
    return true;
  }
  async modifyCurveOfKey(e, t) {
    e = this.queryKeyframe(e);
    return !!e && (utils_1.utils.copyCurveData(t, e), (this._isDirty = true));
  }
  getCurveDuration() {
    let e = 0;
    var t;
    var a;
    var r;
    var i;

    if (this._keyframeData && this._keyframeData.length > 0) {
      t = this._keyframeData[this._keyframeData.length - 1].frame;
      a = this.getCompName();
      r = this.getPropName();
      i = this.getClipSample();

      e =
        a === cc_1.js.getClassName(cc_1.Sprite) && r === "spriteFrame"
          ? (t + 1) / i
          : t / i;
    }

    return e;
  }
  async getPropValueAtFrame(t) {
    let a = null;
    var r = this.propData;
    if (this._keyframeData.length === 0) {
      var sample = utils_1.utils.getDefaultValue(r.type?.value);

      if (sample != null) {
        a = dump_1.default.encodeObject(sample, { default: undefined });
      }
    } else {
      var { sample, curve } = this._getMockCurve();
      let e = curve.evaluate(t / sample);
      (a = dump_1.default.encodeObject(e, { default: undefined })) ?? false;
    }
    return a;
  }
  _getMockCurve() {
    const t = this.getClipSample();
    var e = new cc_1.RealCurve();

    e.assignSorted(
      this._keyframeData.map((e) => [
        e.frame / t,
        {
          value: e.value,
          interpolationMode: e.interpMode,
          leftTangent: e.inTangent,
          rightTangent: e.outTangent,
          leftTangentWeight: e.inTangentWeight,
          rightTangentWeight: e.outTangentWeight,
          tangentWeightMode: e.tangentWeightMode,
        },
      ])
    );

    e.preExtrapolation = this.preExtrap;
    e.postExtrapolation = this.postExtrap;
    return { sample: t, curve: e };
  }
}
exports.EditorAnimationAuxCurve = EditorAnimationAuxCurve;
