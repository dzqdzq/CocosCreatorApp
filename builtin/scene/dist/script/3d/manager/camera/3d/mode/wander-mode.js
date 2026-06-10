var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.WanderMode = undefined;
const mode_base_1 = require("./mode-base");
const utils_1 = require("../../utils");
const operation_1 = __importDefault(require("../../../operation"));
const cc_1 = require("cc");
const quat_1 = require("../../../../../utils/math/quat");
const vec3_1 = require("../../../../../utils/math/vec3");
const animate_value_1 = require("../../animate-value");
const shortcut_1 = require("../../../shortcut");
const electron_profile_1 = __importDefault(require("@base/electron-profile"));
const profile = electron_profile_1.default.load("global://editor/ui-kit.json");
const v3a = new cc_1.Vec3();
const v3b = new cc_1.Vec3();
const v3c = new cc_1.Vec3();
const v3d = new cc_1.Vec3();
const minSpeedScale = 0.01;
const maxSpeedScale = 2;
function speedToWheelValue(e, t = 0.01, i = 100) {
  return ((e - t) * (maxSpeedScale - minSpeedScale)) / (i - t) + minSpeedScale;
}
function wheel2Speed(e, t = 0.01, i = 100) {
  return ((e - minSpeedScale) * (i - t)) / (maxSpeedScale - minSpeedScale) + t;
}
class WanderMode extends mode_base_1.ModeBase {
  _curMouseDX = 0;
  _curMouseDY = 0;
  _rotateSpeed = 0.002;
  _movingSpeedShiftScale = 10;
  _damping = 0.6;
  _wanderSpeed = 10;
  _flyAcceleration = 2;
  _shiftKey = false;
  _velocity = new cc_1.Vec3();
  _wanderKeyDown = false;
  _destPos = new cc_1.Vec3();
  _destRot = new cc_1.Quat();
  _wanderSpeedTarget = 0;
  _wanderAnim = new animate_value_1.AnimVec3(new cc_1.Vec3());
  _enableAcceleration = true;
  get wanderSpeed() {
    return this._wanderSpeed;
  }
  set wanderSpeed(e) {
    this._wanderSpeed = e;
  }
  get enableAcceleration() {
    return this._enableAcceleration;
  }
  set enableAcceleration(e) {
    this._enableAcceleration = e;
  }
  async enter() {
    var e = this._cameraCtrl.node;
    e.getWorldPosition(this._curPos);
    e.getWorldRotation(this._curRot);
    this._destPos = this._curPos.clone();
    this._destRot = this._curRot.clone();
    utils_1.CameraUtils.showCameraMoveTip();
    this._curMouseDX = 0;
    this._curMouseDY = 0;
    operation_1.default.requestPointerLock();
    this._cameraCtrl.emit("camera-move-mode", utils_1.CameraMoveMode.WANDER);
    cce.Engine.enterState(cce.NeedAnimState.CAMERA_WANDER);
  }
  async exit() {
    operation_1.default.exitPointerLock();
    utils_1.CameraUtils.hideCameraMoveTip();
    this._cameraCtrl.updateViewCenterByDist(-this._cameraCtrl.viewDist);
    cce.Engine.exitState(cce.NeedAnimState.CAMERA_WANDER);
    this._velocity.set(0, 0, 0);
  }
  onMouseMove(e) {
    this._curMouseDX += e.moveDeltaX;
    this._curMouseDY += e.moveDeltaY;
    return false;
  }
  onMouseWheel(e) {
    var t = parseFloat(profile.get("num-input.step")) || 0.1;
    let i = speedToWheelValue(this.wanderSpeed);

    i =
      e.deltaY > 0 ? ((i -= t), Math.max(0.01, i)) : ((i += t), Math.min(2, i));

    this.wanderSpeed = parseFloat(wheel2Speed(i).toFixed(2));
    utils_1.CameraUtils.showCameraWanderSpeed(i, this.wanderSpeed);
  }
  onKeyDown(e) {
    this._shiftKey = e.shiftKey;
    e = shortcut_1.Shortcut.find(e);
    if (e) {
      switch (e.message) {
        case "right": {
          this._velocity.x = 1;
          break;
        }
        case "left": {
          this._velocity.x = -1;
          break;
        }
        case "up": {
          this._velocity.y = 1;
          break;
        }
        case "down": {
          this._velocity.y = -1;
          break;
        }
        case "zoom-out": {
          this._velocity.z = 1;
          break;
        }
        case "zoom-in": {
          this._velocity.z = -1;
        }
      }

      if (!this._wanderKeyDown) {
        this._wanderKeyDown = true;
      }
    }
  }
  onKeyUp(e) {
    this._shiftKey = e.shiftKey;
    e = shortcut_1.Shortcut.find(e);
    if (e) {
      switch (e.message) {
        case "right": {
          if (this._velocity.x > 0) {
            this._velocity.x = 0;
          }

          break;
        }
        case "left": {
          if (this._velocity.x < 0) {
            this._velocity.x = 0;
          }

          break;
        }
        case "up": {
          if (this._velocity.y > 0) {
            this._velocity.y = 0;
          }

          break;
        }
        case "down": {
          if (this._velocity.y < 0) {
            this._velocity.y = 0;
          }

          break;
        }
        case "zoom-out": {
          if (this._velocity.z > 0) {
            this._velocity.z = 0;
          }

          break;
        }
        case "zoom-in": {
          if (this._velocity.z < 0) {
            this._velocity.z = 0;
          }
        }
      }

      if (this._velocity.equals3f(0, 0, 0)) {
        this._wanderKeyDown = false;
      }
    }
  }
  onUpdate(t) {
    var e = this._destPos;
    var i = this._destRot;

    quat_1.MQuat.rotateX(i, i, -this._curMouseDY * this._rotateSpeed);

    quat_1.MQuat.rotateAround(
      i,
      i,
      cc_1.Vec3.UNIT_Y,
      -this._curMouseDX * this._rotateSpeed
    );

    var a = v3b;

    var a =
      (quat_1.MQuat.toEuler(a, i),
      quat_1.MQuat.fromEuler(i, a.x, a.y, 0),
      quat_1.MQuat.slerp(this._curRot, this._curRot, i, this._damping),
      this._velocity.lengthSqr() > 0);

    var i = this._shiftKey ? this._movingSpeedShiftScale : 1;
    if (a) {
      let e = 1;

      if (this._enableAcceleration) {
        e = this._flyAcceleration ** t;
      }

      this._wanderSpeedTarget =
        this._wanderSpeedTarget < cc_1.math.EPSILON
          ? this._wanderSpeed
          : this._wanderSpeedTarget * e;
    } else {
      this._wanderSpeedTarget = 0;
    }

    cc_1.Vec3.multiplyScalar(
      v3c,
      this._velocity.normalize(),
      this._wanderSpeedTarget * i
    );

    this._wanderAnim.target = v3c;
    this._wanderAnim.update(t);
    v3c.set(0, 0, 0);
    vec3_1.MVec3.multiplyScalar(v3d, this._wanderAnim.value, t);
    vec3_1.MVec3.transformQuat(v3d, v3d, this._curRot);
    vec3_1.MVec3.add(e, e, v3d);
    vec3_1.MVec3.lerp(this._curPos, this._curPos, e, this._damping);
    this._cameraCtrl.node.setPosition(this._curPos);
    this._cameraCtrl.node.setRotation(this._curRot);
    this._curMouseDX = 0;
    this._curMouseDY = 0;
    this._cameraCtrl.updateGrid();
  }
}
exports.WanderMode = WanderMode;
