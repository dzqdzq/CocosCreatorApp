Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
class DirectionalLightIconGizmo extends base_1.IconGizmo {
  disableOnSelected = true;
  createController() {
    super.createController();

    this._controller.setTextureByUUID(
      "9cb543ba-d152-4809-8a44-8e7bd5712123@6c48a"
    );
  }
}
exports.default = DirectionalLightIconGizmo;
