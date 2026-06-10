Object.defineProperty(exports, "__esModule", { value: true });
exports.MacSceneWindow = undefined;
const scene_window_base_1 = require("../scene-window-base");
class MacSceneWindow extends scene_window_base_1.SceneWindow {
  _window;
  _handler;
  async init(e) {
    var i;
    this._rect = e;

    if (this._parentHandler) {
      i = (
        await this.request(
          "createWindow",
          e,
          this.name,
          this._parentHandler.toString("base64")
        )
      ).handler;

      this._handler = i;

      this._window = this._nativeManager.createWindow(
        e.width,
        e.height,
        this._handler,
        false,
        false
      );

      this.resize(e);
    }
  }
  async resize(e) {
    this._handler = await super.resize(e);

    if (this._handler) {
      this._window.updateContext(this._handler);
    }
  }
  async setVisible(e) {
    this._handler = await super.setVisible(e);

    if (this._handler) {
      this._window.updateContext(this._handler);
    }
  }
}
exports.MacSceneWindow = MacSceneWindow;
