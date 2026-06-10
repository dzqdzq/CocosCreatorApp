var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, a, r = a) => {
        var i = Object.getOwnPropertyDescriptor(t, a);

        if (
          !i ||
          (!("get" in i) ? !i.writable && !i.configurable : t.__esModule)
        ) {
          i = {
            enumerable: true,
            get() {
              return t[a];
            },
          };
        }

        Object.defineProperty(e, r, i);
      }
    : (e, t, a, r) => {
        e[(r = r === undefined ? a : r)] = t[a];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var i = (e) =>
      (i =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var a = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              a[a.length] = t;
            }
          }
          return a;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var a = i(e), r = 0; r < a.length; r++) {
          if (a[r] !== "default") {
            __createBinding(t, e, a[r]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorAnimationCurve = undefined;
const cc_1 = require("cc");

const editor_animation_curve_base_1 = __importDefault(
  require("./editor-animation-curve-base")
);

const utils_1 = require("./utils");
const dumpEncode = __importStar(require("../../../export/dump/encode"));
class EditorAnimationCurve extends editor_animation_curve_base_1.default {
  _parentCurve = null;
  get parentCurve() {
    return this._parentCurve;
  }
  set parentCurve(e) {
    this._parentCurve = e;
  }
  get isPartCurve() {
    return this._parentCurve;
  }
  get partName() {
    return this._curveInfo.partName;
  }
  get targetPaths() {
    return this._curveInfo.targetPaths;
  }
  get combinedPropKey() {
    var e = this._curveInfo.propKey.lastIndexOf(".");
    return this._curveInfo.propKey.substring(0, e);
  }
  get combinedCurveKeyData() {
    return null;
  }
  get combinedDisplayName() {
    var e = this._curveInfo.displayName.lastIndexOf(".");
    return this._curveInfo.displayName.substring(0, e);
  }
  get displayName() {
    let t = this._curveInfo.displayName;
    if (this.isPartCurve) {
      var a = this._curveInfo.displayName.lastIndexOf(".");
      var r = this._curveInfo.displayName.substring(0, a);
      var i = this._curveInfo.displayName.substring(a + 1);
      let e = "";

      if (0 <= (a = r.lastIndexOf("."))) {
        e = r.substring(a + 1) + ".";
      }

      t = e + i;
    }
    return t;
  }
  isActive = true;
  constructor(e, t) {
    super();
    this._node = e;
    this._clipData = t;
  }
  async getDumpData() {
    var e = utils_1.utils.dumpKeyframeData(this._keyframeData);
    var t = this._curveInfo.type?.value;
    var t = utils_1.utils.isTypeSupportCurve(t);
    return {
      nodePath: this._curveInfo.nodePath,
      keyframes: e,
      displayName: this.displayName,
      key: this._curveInfo.propKey,
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
    var t;
    var a = null;

    if ((a = this._curveInfo.targetPaths) && a.length > 0) {
      if (a.isHierarchyAt(0)) {
        if (e === "/") {
          this._curveInfo.targetPaths = a.slice(1);
        } else {
          t = e.substr(1);

          this._curveInfo.targetPaths = new cc_1.animation.TrackPath()
            .toHierarchy(t)
            .append(a.slice(1));
        }
      } else if (e !== "/") {
        t = e.substr(1);

        this._curveInfo.targetPaths = new cc_1.animation.TrackPath()
          .toHierarchy(t)
          .append(a);
      }
    }

    this._curveInfo.nodePath = utils_1.utils.getNodePath(
      this._curveInfo.targetPaths
    );
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
    var i = await utils_1.utils.getValueFrom(this._node, r, a);
    var n = this.queryKeyframe(t);
    if (n) {
      n.value = i;

      if (a) {
        utils_1.utils.copyCurveData(a, n);
      }
    } else {
      let e = 0;
      for (
        e = 0;
        e < this._keyframeData.length && !(this._keyframeData[e].frame > t);
        e++
      ) {}
      n = { frame: t, value: i, interpMode: cc_1.RealInterpolationMode.LINEAR };

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
          var l = this._keyframeData[e].frame;
          if (l >= t) {
            a = e;
            r = true;

            if (l === t) {
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
      var o = i ? 1 : 0;
      var h = { frame: t, value: u.value };
      utils_1.utils.copyCurveData(u, h);
      this._keyframeData.splice(a, o, h);
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
    var a = this.propData;
    for (let e = 0; e < t.length; e++) {
      var r = t[e];
      var r = this.queryKeyframe(r);
      if (!r) {
        return false;
      }
      var i = await utils_1.utils.getValueFrom(this._node, a, null);
      r.value = i;
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
    t.sort((e, t) => e - t);

    if (t.length > 1) {
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
  async getPropValueAtFrame(a) {
    let r = null;
    var i = this.propData;
    if (this._keyframeData.length === 0) {
      let e = await utils_1.utils.getValueFrom(this._node, i);
      (r = dumpEncode.encodeObject(e, { default: undefined })) ?? false;
    } else {
      const n = this.getClipSample();
      let e = null;
      switch (this.curveInfo.type.value) {
        case "cc.Quat": {
          (e = new cc_1.QuatCurve()).assignSorted(
            this._keyframeData.map((e) => [e.frame / n, { value: e.value }])
          );

          e.preExtrapolation = this.preExtrap;
          e.postExtrapolation = this.postExtrap;
          break;
        }
        case "cc.Number":
        case "Number":
        case "Integer":
        case "Float": {
          (e = new cc_1.RealCurve()).assignSorted(
            this._keyframeData.map((e) => [
              e.frame / n,
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
          break;
        }
        default: {
          (e = new cc_1.ObjectCurve()).assignSorted(
            this._keyframeData.map((e) => [e.frame / n, e.value])
          );
        }
      }
      let t = e.evaluate(a / n);
      (r = dumpEncode.encodeObject(t, { default: undefined })) ?? false;
    }
    return r;
  }
}
exports.EditorAnimationCurve = EditorAnimationCurve;
exports.default = EditorAnimationCurve;
