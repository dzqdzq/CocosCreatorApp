Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
class ReflectionProbeIconGizmo extends base_1.IconGizmo {
  disableOnSelected = true;
  createController() {
    super.createController();

    this._controller.setTextureByUUID(
      "dee6f7cc-ba21-4091-948f-4f508495f260@6c48a"
    );
  }
  updateController() {
    if (this._isInitialized && this.target !== null) {
      super.updateController();
    }
  }
}
exports.default = ReflectionProbeIconGizmo;
