Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../base");
class SphereLightIconGizmo extends base_1.IconGizmo {
  disableOnSelected = true;
  createController() {
    super.createController();

    this._controller.setTextureByUUID(
      "c78f78a5-3553-4d1f-ad3b-177fe55af68b@6c48a"
    );

    this.updateController();
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
exports.default = SphereLightIconGizmo;
