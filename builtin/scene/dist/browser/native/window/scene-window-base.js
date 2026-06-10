Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneWindow = undefined;
const ipc_1 = require("../ipc");
class SceneWindow {
  name = "";
  previewProcess = false;
  _parentHandler;
  _nativeManager;
  _visible = false;
  _rect;
  constructor(e, s, t, i) {
    this._nativeManager = e;
    this._parentHandler = s;
    this.name = t;
    this.previewProcess = i;
  }
  async init(e) {
    this._rect = e;
  }
  async request(e, ...s) {
    return this.previewProcess
      ? ipc_1.b2sIpc.requestToPreview(e, ...s)
      : ipc_1.b2sIpc.requestToScene(e, ...s);
  }
  async setVisible(e) {
    this._visible = e;
    return this.request("setVisible", this.name, e);
  }
  async resize(e) {
    this._rect = e;
    return this.request("resize", e.x, e.y, e.width, e.height, this.name);
  }
  async close() {
    return this.request("close", this.name);
  }
  async redirectTargetWindow() {
    return this.request("redirectTargetWindow", this.name);
  }
}
exports.SceneWindow = SceneWindow;
