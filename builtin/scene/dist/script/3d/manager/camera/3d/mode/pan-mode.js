Object.defineProperty(exports, "__esModule", { value: true });
exports.PanMode = undefined;
const mode_base_1 = require("./mode-base");
const vec3_1 = require("../../../../../utils/math/vec3");
const cc_1 = require("cc");
const utils_1 = require("../../utils");
const v3a = new cc_1.Vec3();
const v3b = new cc_1.Vec3();
class PanMode extends mode_base_1.ModeBase {
  _right = new cc_1.Vec3();
  _up = new cc_1.Vec3();
  _panningSpeed = 0.4;
  async enter() {
    this._cameraCtrl.node.getWorldRotation(this._curRot);
    vec3_1.MVec3.transformQuat(this._right, cc_1.Vec3.UNIT_X, this._curRot);
    vec3_1.MVec3.normalize(this._right, this._right);
    vec3_1.MVec3.transformQuat(this._up, cc_1.Vec3.UNIT_Y, this._curRot);
    vec3_1.MVec3.normalize(this._up, this._up);
    this._cameraCtrl.emit("camera-move-mode", utils_1.CameraMoveMode.PAN);
    cce.Engine.enterState(cce.NeedAnimState.CAMERA_PAN);
  }
  async exit() {
    this._cameraCtrl.updateViewCenterByDist(-this._cameraCtrl.viewDist);
    cce.Engine.exitState(cce.NeedAnimState.CAMERA_PAN);
  }
  onMouseMove(e) {
    var e_moveDeltaX = e.moveDeltaX;
    var e = e.moveDeltaY;
    var c = this._cameraCtrl.viewDist / 800;

    vec3_1.MVec3.multiplyScalar(
      v3a,
      this._right,
      -e_moveDeltaX * this._panningSpeed * c
    );

    vec3_1.MVec3.multiplyScalar(v3b, this._up, e * this._panningSpeed * c);
    this._cameraCtrl.node.getWorldPosition(this._curPos);
    vec3_1.MVec3.add(this._curPos, this._curPos, v3a);
    vec3_1.MVec3.add(this._curPos, this._curPos, v3b);
    this._cameraCtrl.node.setWorldPosition(this._curPos);

    vec3_1.MVec3.add(
      this._cameraCtrl.sceneViewCenter,
      this._cameraCtrl.sceneViewCenter,
      v3a
    );

    vec3_1.MVec3.add(
      this._cameraCtrl.sceneViewCenter,
      this._cameraCtrl.sceneViewCenter,
      v3b
    );

    this._cameraCtrl.viewDist = vec3_1.MVec3.distance(
      this._curPos,
      this._cameraCtrl.sceneViewCenter
    );

    this._cameraCtrl.updateGrid();
    return false;
  }
}
exports.PanMode = PanMode;
