Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
class SpotLightIconGizmo extends base_1.IconGizmo {
  disableOnSelected = true;
  createController() {
    super.createController();

    this._controller.setTextureByUUID(
      "191b676f-175b-41fa-8283-ac539875bfd8@6c48a"
    );
  }
  updateController() {
    var e;
    var t;

    if (this._isInitialized && this.target !== null) {
      this.updateControllerTransform();
      e = (t = this.target).color.clone();

      t.useColorTemperature &&
        ((t = t._light.colorTemperatureRGB),
        (e.r *= t.x),
        (e.g *= t.y),
        (e.b *= t.z));

      this._controller.setColor(e);
    }
  }
}
exports.default = SpotLightIconGizmo;
