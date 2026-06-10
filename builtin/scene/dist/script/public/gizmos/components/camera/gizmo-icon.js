Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
class CameraIconGizmo extends base_1.IconGizmo {
  createController() {
    super.createController();

    this._controller.setTextureByUUID(
      "bd373594-df84-486d-a34a-19d09ddaa973@6c48a"
    );
  }
}
exports.default = CameraIconGizmo;
