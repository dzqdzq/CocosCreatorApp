Object.defineProperty(exports, "__esModule", { value: true });

exports.animationBlendType = undefined;
exports.motionType = undefined;
exports.MotionEnv = undefined;

const env_type_1 = require("../env-type");
class MotionEnv {
  motion;
  motionLevel;
  constructor(e, n) {
    this.motion = e;
    this.motionLevel = n;
    this.motion = e;
  }
}
exports.MotionEnv = MotionEnv;

exports.motionType = [
  env_type_1.EnvType.ClipMotion,
  env_type_1.EnvType.AnimationBlend1D,
  env_type_1.EnvType.AnimationBlend2D,
];

exports.animationBlendType = [
  env_type_1.EnvType.AnimationBlend1D,
  env_type_1.EnvType.AnimationBlend2D,
];
