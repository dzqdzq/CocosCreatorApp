Object.defineProperty(exports, "__esModule", { value: true });
exports.PanMode = undefined;
const mode_base_1 = require("./mode-base");
const utils_1 = require("../../utils");
class PanMode extends mode_base_1.ModeBase {
  _panningSpeed = 0.4;
  async enter() {
    this._cameraCtrl.emit("camera-move-mode", utils_1.CameraMoveMode.PAN);
    cce.Engine.enterState(cce.NeedAnimState.CAMERA_PAN);
  }
  async exit() {
    cce.Engine.exitState(cce.NeedAnimState.CAMERA_PAN);
  }
  onMouseMove(e) {
    var e_moveDeltaX = e.moveDeltaX;
    var e = e.moveDeltaY;
    this._cameraCtrl.grid.pan(e_moveDeltaX, e);
    this._cameraCtrl.updateGrid();
    this._cameraCtrl.adjustCamera();
    return false;
  }
}
exports.PanMode = PanMode;
