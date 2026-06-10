Object.defineProperty(exports, "__esModule", { value: true });
exports.OrbitMode = undefined;
const mode_base_1 = require("./mode-base");
const vec3_1 = require("../../../../../utils/math/vec3");
const utils_1 = require("../../utils");
const quat_1 = require("../../../../../utils/math/quat");
const cc_1 = require("cc");
class OrbitMode extends mode_base_1.ModeBase {
  _rotateSpeed = 0.006;
  async enter() {
    var e = this._cameraCtrl.node;
    e.getWorldPosition(this._curPos);
    e.getWorldRotation(this._curRot);

    this._cameraCtrl.view = vec3_1.MVec3.distance(
      this._curPos,
      this._cameraCtrl.sceneViewCenter
    );

    this._cameraCtrl.emit("camera-move-mode", utils_1.CameraMoveMode.ORBIT);
    cce.Engine.enterState(cce.NeedAnimState.CAMERA_ORBIT);
  }
  async exit() {
    cce.Engine.exitState(cce.NeedAnimState.CAMERA_ORBIT);
  }
  onMouseDown(e) {
    return false;
  }
  onMouseMove(e) {
    var t;
    var r;
    var a;
    return (
      !e.leftButton ||
      ((a = e.moveDeltaX),
      (e = e.moveDeltaY),
      (t = this._curRot),
      (r = cc.v3()),
      quat_1.MQuat.rotateX(t, t, -e * this._rotateSpeed),
      quat_1.MQuat.rotateAround(t, t, cc_1.Vec3.UNIT_Y, -a * this._rotateSpeed),
      quat_1.MQuat.toEuler(r, t),
      quat_1.MQuat.fromEuler(t, r.x, r.y, 0),
      (e = cc.v3(0, 0, 1)),
      vec3_1.MVec3.transformQuat(e, e, t),
      vec3_1.MVec3.normalize(e, e),
      vec3_1.MVec3.multiplyScalar(e, e, this._cameraCtrl.viewDist),
      vec3_1.MVec3.add(this._curPos, this._cameraCtrl.sceneViewCenter, e),
      this._cameraCtrl.node.setWorldPosition(this._curPos),
      (a = cc.v3(0, 1, 0)),
      vec3_1.MVec3.transformQuat(a, a, t),
      vec3_1.MVec3.normalize(a, a),
      this._cameraCtrl.node.lookAt(this._cameraCtrl.sceneViewCenter, a),
      this._cameraCtrl.updateGrid(),
      false)
    );
  }
  onMouseUp(e) {
    return false;
  }
}
exports.OrbitMode = OrbitMode;
