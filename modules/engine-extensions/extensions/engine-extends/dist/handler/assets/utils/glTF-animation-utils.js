var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (t, e, n, a = n) => {
        var r = Object.getOwnPropertyDescriptor(e, n);

        if (
          !r ||
          (!("get" in r) ? !r.writable && !r.configurable : e.__esModule)
        ) {
          r = {
            enumerable: true,
            get() {
              return e[n];
            },
          };
        }

        Object.defineProperty(t, a, r);
      }
    : (t, e, n, a) => {
        t[(a = a === undefined ? n : a)] = e[n];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (t, e) => {
        Object.defineProperty(t, "default", { enumerable: true, value: e });
      }
    : (t, e) => {
        t.default = e;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var r = (t) =>
      (r =
        Object.getOwnPropertyNames ||
        ((t) => {
          var e;
          var n = [];
          for (e in t) {
            if (Object.prototype.hasOwnProperty.call(t, e)) {
              n[n.length] = e;
            }
          }
          return n;
        }))(t);
    return (t) => {
      if (t && t.__esModule) {
        return t;
      }
      var e = {};
      if (t != null) {
        for (var n = r(t), a = 0; a < n.length; a++) {
          if (n[a] !== "default") {
            __createBinding(e, t, n[a]);
          }
        }
      }
      __setModuleDefault(e, t);
      return e;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.GlTFTrsTrackData = undefined;
exports.GlTFTrsAnimationData = undefined;
const glTF_constants_1 = require("./glTF.constants");
const cc = __importStar(require("cc"));
const exotic_animation_1 = require("cc/editor/exotic-animation");
class GlTFTrsAnimationData {
  nodes = {};
  inputs = [];
  addNodeAnimation(t) {
    return (this.nodes[t] ??= new GlTFNodeTrsAnimationData());
  }
  createExotic() {
    var t;
    var e;
    var n = new exotic_animation_1.ExoticAnimation();
    for ([t, e] of Object.entries(this.nodes)) {
      e.emitExotic(n, t);
    }
    return n;
  }
}
exports.GlTFTrsAnimationData = GlTFTrsAnimationData;
const INPUT_0 = new Float32Array([0]);
class GlTFNodeTrsAnimationData {
  position = null;
  rotation = null;
  scale = null;
  setConstantPosition(t) {
    this.position = new GlTFTrsTrackData(
      glTF_constants_1.GlTfAnimationInterpolation.STEP,
      INPUT_0,
      cc.Vec3.toArray(new Float32Array(3), t)
    );
  }
  setConstantRotation(t) {
    this.rotation = new GlTFTrsTrackData(
      glTF_constants_1.GlTfAnimationInterpolation.STEP,
      INPUT_0,
      cc.Quat.toArray(new Float32Array(4), t)
    );
  }
  setConstantScale(t) {
    this.scale = new GlTFTrsTrackData(
      glTF_constants_1.GlTfAnimationInterpolation.STEP,
      INPUT_0,
      cc.Vec3.toArray(new Float32Array(3), t)
    );
  }
  emitExotic(t, e) {
    var { position, rotation, scale } = this;

    if (
      (position || rotation || scale) &&
      ((t = t.addNodeAnimation(e)),
      position &&
        (({ input: e, output: position } = position.toLinearVec3Curve(30)),
        t.createPosition(e, position)),
      rotation &&
        (({ input: e, output: position } =
          rotation.toLinearQuatCurveNormalized(30)),
        t.createRotation(e, position)),
      scale)
    ) {
      ({ input: rotation, output: e } = scale.toLinearVec3Curve(30));
      t.createScale(rotation, e);
    }
  }
}
class GlTFTrsTrackData {
  interpolation;
  input;
  output;
  constructor(t, e, n) {
    this.interpolation = t;
    this.input = e;
    this.output = n;
  }
  toLinearVec3Curve(t) {
    switch (this.interpolation) {
      case glTF_constants_1.GlTfAnimationInterpolation.CUBIC_SPLINE: {
        return cubicSplineToLinearCurveData(this.input, this.output, 3, t);
      }
      case glTF_constants_1.GlTfAnimationInterpolation.STEP: {
        return constantToLinearCurveData(this.input, this.output, 3, t);
      }
      default: {
        return { input: this.input, output: this.output };
      }
    }
  }
  toLinearQuatCurveNormalized(t) {
    var t = this.toLinearQuatCurve(t);
    var t_output = t.output;
    var n = new cc.Quat();
    for (let t = 0; t < t_output.length / 4; ++t) {
      cc.Quat.fromArray(n, t_output, 4 * t);
      cc.Quat.normalize(n, n);
      cc.Quat.toArray(t_output, n, 4 * t);
    }
    return t;
  }
  toLinearQuatCurve(t) {
    switch (this.interpolation) {
      case glTF_constants_1.GlTfAnimationInterpolation.CUBIC_SPLINE: {
        return cubicSplineToLinearCurveData(this.input, this.output, 4, t);
      }
      case glTF_constants_1.GlTfAnimationInterpolation.STEP: {
        return constantToLinearCurveData(this.input, this.output, 4, t);
      }
      default: {
        return { input: this.input, output: this.output };
      }
    }
  }
}
function calculateBakeParams(t, e) {
  var [n] = t;
  var t = t[t.length - 1];
  var e = 1 / e;
  return { startTime: n, endTime: t, interval: e, count: (t - n) / e };
}
function createTimesFromBakeParams(t, e) {
  var { startTime, endTime, interval, count } = t;
  var i = new e(count);
  for (let t = 0; t < count; t++) {
    i[t] = t === count - 1 ? endTime : startTime + interval * t;
  }
  return i;
}
function constantToLinearCurveData(t, a, r, e) {
  if (t.length < 2) {
    return { input: t, output: a };
  }
  var o = a.length / r;
  var i = calculateBakeParams(t, e);
  var u = new Float32Array(r * i.count);
  for (let n = 0; n < r; ++n) {
    var c = new cc.RealCurve();

    c.assignSorted(
      Array.from(t),
      Array.from({ length: o }, (t, e) => ({
        value: a[r * e + n],
        interpolationMode: cc.RealInterpolationMode.CONSTANT,
      }))
    );

    bake(c, i, u, r, n);
  }
  return { input: createTimesFromBakeParams(i, Float32Array), output: u };
}
function cubicSplineToLinearCurveData(t, r, o, e) {
  if (t.length < 2) {
    return { input: t, output: r };
  }
  var n = r.length / (3 * o);
  var i = calculateBakeParams(t, e);
  var u = new Float32Array(o * i.count);
  for (let a = 0; a < o; ++a) {
    var c = new cc.RealCurve();

    c.assignSorted(
      Array.from(t),
      Array.from({ length: n }, (t, e) => {
        var e = 3 * o * e + a;
        var n = r[e + 0 * o];
        return {
          value: r[e + Number(o)],
          leftTangent: n,
          rightTangent: r[e + 2 * o],
          interpolationMode: cc.RealInterpolationMode.CUBIC,
        };
      })
    );

    bake(c, i, u, o, a);
  }
  return { input: createTimesFromBakeParams(i, Float32Array), output: u };
}
function bake(e, t, n, a, r) {
  var { startTime: t, endTime, interval, count } = t;
  let c = t;
  for (let t = 0; t < count; ++t, c += interval) {
    var s = e.evaluate(t === count - 1 ? endTime : c);
    n[a * t + r] = s;
  }
}
exports.GlTFTrsTrackData = GlTFTrsTrackData;
