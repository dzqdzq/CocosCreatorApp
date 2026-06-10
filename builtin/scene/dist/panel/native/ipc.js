var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.PanelIpc = undefined;
const events_1 = __importDefault(require("events"));
class PanelIpc extends events_1.default {
  _engineView = null;
  setEngineView(e) {
    this._engineView = e;
  }
  sendToScene(e, ...n) {
    var t = this._engineView;

    if (t?.callNativeSceneMethod) {
      t.callNativeSceneMethod(t.isPreviewEnabled, e, ...n);
    }
  }
  async requestToScene(e, ...n) {
    var t = this._engineView;
    if (t?.callNativeSceneMethod) {
      return t.callNativeSceneMethod(t.isPreviewEnabled, e, ...n);
    }
  }
  onSceneToPanel(e, ...n) {
    this.emit("onSceneToPanel", e, ...n);
  }
  sendToBrowser(e, ...n) {
    Editor.Message.send("scene", "panel-browser", e, ...n);
  }
  async requestToBrowser(t, ...s) {
    return new Promise((e) => {
      let n = setTimeout(() => {
        n = null;
        console.debug(`nativeWindowPanel requestToBrowser:${t} timeout`);
        e(false);
      }, 1000 /* 1e3 */);
      Editor.Message.request("scene", "panel-browser", t, ...s).then(() => {
        if (n) {
          n = null;
          clearTimeout(n);
        }

        e(true);
      });
    });
  }
  async onBrowserToPanel(n, t, ...s) {
    return new Promise((e) => {
      this.emit("onBrowserToPanel", {
        panel: n,
        method: t,
        args: s,
        callback: e,
      });
    });
  }
}
const panelIpc = new PanelIpc();
exports.PanelIpc = panelIpc;
