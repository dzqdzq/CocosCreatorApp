Object.defineProperty(exports, "__esModule", { value: true });
exports.IdleMode = undefined;
const mode_base_1 = require("./mode-base");
const utils_1 = require("../../utils");
class IdleMode extends mode_base_1.ModeBase {
  async enter() {
    this._cameraCtrl.emit("camera-move-mode", utils_1.CameraMoveMode.IDLE);
  }
  async exit() {}
}
exports.IdleMode = IdleMode;
