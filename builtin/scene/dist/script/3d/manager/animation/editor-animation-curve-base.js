Object.defineProperty(exports, "__esModule", { value: true });
const cc_1 = require("cc");
const type_defines_1 = require("./type-defines");
const utils_1 = require("./utils");
class EditorAnimationCurveBase {
  _node;
  _clipData;
  _curveInfo;
  _keyframeData = [];
  _isDirty = false;
  _preExtrap = cc_1.ExtrapolationMode.CLAMP;
  _postExtrap = cc_1.ExtrapolationMode.CLAMP;
  set node(e) {
    this._node = e;
  }
  get dirty() {
    return this._isDirty;
  }
  set dirty(e) {
    this._isDirty = e;
  }
  get curveInfo() {
    return this._curveInfo;
  }
  set curveInfo(e) {
    this._curveInfo = e;
  }
  get keyframeData() {
    return this._keyframeData;
  }
  set keyframeData(e) {
    this._keyframeData = e;
  }
  get nodePath() {
    return this._curveInfo.nodePath;
  }
  get propKey() {
    return this._curveInfo.propKey;
  }
  get propData() {
    return {
      combinedType: this._curveInfo.combinedType,
      type: this._curveInfo.type,
      targetPaths: this._curveInfo.targetPaths,
      valueAdapter: this._curveInfo.valueAdapter,
      commonTarget: this._curveInfo.commonTarget,
    };
  }
  get preExtrap() {
    return this._preExtrap;
  }
  set preExtrap(e) {
    this._preExtrap = e;
  }
  get postExtrap() {
    return this._postExtrap;
  }
  set postExtrap(e) {
    this._postExtrap = e;
  }
  getClipSample() {
    return this._clipData.sharedData.sample;
  }
  getClipDuration() {
    return this._clipData.sharedData.duration;
  }
  initFromCurve(e, t) {
    this._keyframeData = [];
    this.curveInfo = e;

    if (t) {
      var a = [...t.times()];
      if (!(a.length <= 0)) {
        var r = [...t.values()];
        for (let e = 0; e < a.length; e++) {
          var n;
          var i;
          var o = a[e];

          var o = {
            frame: Math.round(o * this._clipData.sharedData.sample),
            value: 0,
          };

          if (t instanceof cc_1.RealCurve) {
            n = r[e];
            o.value = n.value;
            o.interpMode = n.interpolationMode;
            o.inTangent = n.leftTangent;
            o.inTangentWeight = n.leftTangentWeight;
            o.outTangent = n.rightTangent;
            o.outTangentWeight = n.rightTangentWeight;
            o.tangentWeightMode = n.tangentWeightMode;
            o.easingMethod = n.easingMethod;

            n[cc_1.editorExtrasTag] &&
              ((o.broken = n[cc_1.editorExtrasTag].broken),
              (o.tangentMode = n[cc_1.editorExtrasTag].tangentMode));
          } else if (t instanceof cc_1.QuatCurve) {
            n = r[e];
            o.value = n.value;
          } else {
            i = r[e];
            o.value = i;
          }

          this._keyframeData.push(o);
        }

        if (t instanceof cc_1.RealCurve || t instanceof cc_1.QuatCurve) {
          this.preExtrap = t.preExtrapolation;
          this.postExtrap = t.postExtrapolation;
        }
      }
    }
  }
  async decodeDump(e) {
    this._curveInfo.nodePath = e.nodePath;
    this._curveInfo.propKey = e.key;
    this._curveInfo.type = e.type;

    this._keyframeData = await utils_1.utils.getKeyframeDataFromDump(
      e.keyframes
    );
  }
  autoSetTangents() {
    if (this._curveInfo.type?.value === "Number") {
      for (let o = 0; o < this._keyframeData.length; o++) {
        var s = this._keyframeData[o];

        let { inTangent, outTangent } = s;

        let a = s;
        let r = s;
        let n = s;
        let i = false;

        if (o === 0) {
          if (
            o < this._keyframeData.length - 1 &&
            s.tangentMode === type_defines_1.TangentMode.AUTO &&
            ((outTangent = 0),
            s.interpMode === cc_1.RealInterpolationMode.CUBIC)
          ) {
            n = this._keyframeData[o + 1];
            r = n;
            i = true;
          }
        } else if (o < this._keyframeData.length - 1) {
          a = this._keyframeData[o - 1];

          s.interpMode === cc_1.RealInterpolationMode.CUBIC &&
          s.tangentMode === type_defines_1.TangentMode.AUTO
            ? ((n = this._keyframeData[o + 1]), (i = true))
            : (a.interpMode !== cc_1.RealInterpolationMode.CONSTANT &&
                s.interpMode !== cc_1.RealInterpolationMode.CONSTANT) ||
              ((outTangent = 0),
              a.interpMode !== cc_1.RealInterpolationMode.CUBIC &&
                (inTangent = 0));
        } else if (
          s.interpMode === cc_1.RealInterpolationMode.CUBIC &&
          s.tangentMode === type_defines_1.TangentMode.AUTO &&
          ((inTangent = 0), this._keyframeData.length > 1)
        ) {
          a = this._keyframeData[o - 1];
          i = true;
        }

        if (i) {
          s = this.getClipSample();

          s = this.calculateCurveTangent(
            a.frame / s,
            a.value,
            r.frame / s,
            r.value,
            n.frame / s,
            n.value
          );

          inTangent = s ?? inTangent;
          outTangent = inTangent;
        }
      }
    }
  }
  calculateCurveTangent(e, t, a, r, n, i) {
    let o;

    if (utils_1.utils.isNumber(r)) {
      o = r - t + (i - r);
      o /= n - e;
    }

    return o;
  }
}
exports.default = EditorAnimationCurveBase;
