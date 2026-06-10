var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (t, a, e, n = e) => {
        Object.defineProperty(t, n, {
          enumerable: true,
          get() {
            return a[e];
          },
        });
      }
    : (t, a, e, n) => {
        t[(n = n === undefined ? e : n)] = a[e];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (t, a) => {
        Object.defineProperty(t, "default", { enumerable: true, value: a });
      }
    : (t, a) => {
        t.default = a;
      });

var __importStar =
  (this && this.__importStar) ||
  ((t) => {
    if (t && t.__esModule) {
      return t;
    }
    var a = {};
    if (t != null) {
      for (var e in t) {
        if (e !== "default" && Object.prototype.hasOwnProperty.call(t, e)) {
          __createBinding(a, t, e);
        }
      }
    }
    __setModuleDefault(a, t);
    return a;
  });

Object.defineProperty(exports, "__esModule", { value: true });
exports.GlTFTrsTrackData = undefined;
exports.GlTFTrsAnimationData = undefined;
const glTF_constants_1 = require("./glTF.constants");
const cc = __importStar(require("cc"));
const exotic_animation_1 = require("cc/editor/exotic-animation");
class GlTFTrsAnimationData {
  constructor() {
    this.nodes = {};
    this.inputs = [];
  }
  addNodeAnimation(t) {
    var a;
    var e;
    return null != (a = (e = this.nodes)[t])
      ? a
      : (e[t] = new GlTFNodeTrsAnimationData());
  }
  createExotic() {
    var t;
    var a;
    var e = new exotic_animation_1.ExoticAnimation();
    for ([t, a] of Object.entries(this.nodes)) {
      a.emitExotic(e, t);
    }
    return e;
  }
}
exports.GlTFTrsAnimationData = GlTFTrsAnimationData;
const INPUT_0 = new Float32Array([0]);
class GlTFNodeTrsAnimationData {
  constructor() {
    this.position = null;
    this.rotation = null;
    this.scale = null;
  }
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
  emitExotic(t, a) {
    var { position, rotation, scale } = this;

    if (
      (position || rotation || scale) &&
      ((t = t.addNodeAnimation(a)),
      position &&
        (({ input: a, output: position } = position.toLinearVec3Curve(30)),
        t.createPosition(a, position)),
      rotation &&
        (({ input: a, output: position } =
          rotation.toLinearQuatCurveNormalized(30)),
        t.createRotation(a, position)),
      scale)
    ) {
      ({ input: rotation, output: a } = scale.toLinearVec3Curve(30));
      t.createScale(rotation, a);
    }
  }
}
class GlTFTrsTrackData {
  constructor(t, a, e) {
    this.interpolation = t;
    this.input = a;
    this.output = e;
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
    var e = new cc.Quat();
    for (let t = 0; t < t_output.length / 4; ++t) {
      cc.Quat.fromArray(e, t_output, 4 * t);
      cc.Quat.normalize(e, e);
      cc.Quat.toArray(t_output, e, 4 * t);
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
function calculateBakeParams(t, a) {
  var [e] = t;
  var t = t[t.length - 1];
  var a = 1 / a;
  return { startTime: e, endTime: t, interval: a, count: (t - e) / a };
}
function createTimesFromBakeParams(t, a) {
  const { startTime, endTime, interval, count } = t;
  return a.from({ length: count }, (t, a) =>
    a === count - 1 ? endTime : startTime + interval * a
  );
}
function constantToLinearCurveData(t, n, r, a) {
  if (t.length < 2) {
    return { input: t, output: n };
  }
  var o = n.length / r;
  var i = calculateBakeParams(t, a);
  var u = new Float32Array(r * i.count);
  for (let e = 0; e < r; ++e) {
    var s = new cc.RealCurve();

    s.assignSorted(
      Array.from(t),
      Array.from({ length: o }, (t, a) => ({
        value: n[r * a + e],
        interpolationMode: cc.RealInterpolationMode.CONSTANT,
      }))
    );

    bake(s, i, u, r, e);
  }
  return { input: createTimesFromBakeParams(i, Float32Array), output: u };
}
function cubicSplineToLinearCurveData(t, r, o, a) {
  if (t.length < 2) {
    return { input: t, output: r };
  }
  var e = r.length / (3 * o);
  var i = calculateBakeParams(t, a);
  var u = new Float32Array(o * i.count);
  for (let n = 0; n < o; ++n) {
    var s = new cc.RealCurve();

    s.assignSorted(
      Array.from(t),
      Array.from({ length: e }, (t, a) => {
        var a = 3 * o * a + n;
        var e = r[a + 0 * o];
        return {
          value: r[a + Number(o)],
          leftTangent: e,
          rightTangent: r[a + 2 * o],
          interpolationMode: cc.RealInterpolationMode.CUBIC,
        };
      })
    );

    bake(s, i, u, o, n);
  }
  return { input: createTimesFromBakeParams(i, Float32Array), output: u };
}
function bake(a, t, e, n, r) {
  var { startTime: t, endTime, interval, count } = t;
  let s = t;
  for (let t = 0; t < count; ++t, s += interval) {
    var c = a.evaluate(t === count - 1 ? endTime : s);
    e[n * t + r] = c;
  }
}
exports.GlTFTrsTrackData = GlTFTrsTrackData;
