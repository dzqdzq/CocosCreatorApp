Object.defineProperty(exports, "__esModule", { value: true });
exports.Win32SceneWindow = undefined;
const scene_window_base_1 = require("../scene-window-base");
class Win32SceneWindow extends scene_window_base_1.SceneWindow {
  async init(e) {
    this._rect = e;

    if (this._parentHandler) {
      await this.request(
        "createWindow",
        e,
        this.name,
        this._parentHandler.toString("base64")
      );

      this.resize(e);
    }
  }
  async redraw() {}
}
exports.Win32SceneWindow = Win32SceneWindow;
