Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
class ParticleSystemIconGizmo extends base_1.IconGizmo {
  disableOnSelected = true;
  createController() {
    super.createController();

    this._controller.setTextureByUUID(
      "55052bc6-9909-43c1-b2fc-8818060fb069@6c48a"
    );
  }
}
exports.default = ParticleSystemIconGizmo;
