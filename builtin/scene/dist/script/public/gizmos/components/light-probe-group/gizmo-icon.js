Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
class LightProbeIconGizmo extends base_1.IconGizmo {
  disableOnSelected = true;
  createController() {
    super.createController();

    this._controller.setTextureByUUID(
      "9e0cc8d3-a76b-4bee-b53e-f3abab91c4b8@6c48a"
    );
  }
}
exports.default = LightProbeIconGizmo;
