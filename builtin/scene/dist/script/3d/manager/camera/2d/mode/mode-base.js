Object.defineProperty(exports, "__esModule", { value: true });
exports.ModeBase = undefined;
const cc_1 = require("cc");
class ModeBase {
  _cameraCtrl;
  modeName;
  _curRot = new cc_1.Quat();
  _curPos = new cc_1.Vec3();
  constructor(e, o) {
    this._cameraCtrl = e;
    this.modeName = o;
  }
  async enter() {}
  async exit() {}
  onMouseDBlDown(e) {
    return true;
  }
  onMouseDown(e) {
    return true;
  }
  onMouseMove(e) {
    return true;
  }
  onMouseUp(e) {
    return true;
  }
  onMouseWheel(e) {}
  onKeyDown(e) {}
  onKeyUp(e) {}
  onUpdate(e) {}
}
exports.ModeBase = ModeBase;
