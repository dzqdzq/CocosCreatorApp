Object.defineProperty(exports, "__esModule", { value: true });
exports.ScenePanelManager = undefined;
const panel_constant_1 = require("./panel-constant");
const ipc_1 = require("./native/ipc");
class PanelManager {
  _scenePanel;
  _previewPanel = null;
  constructor() {}
  get scene() {
    return this._scenePanel;
  }
  set scene(e) {
    if (e.nativeWindowPanel) {
      this._scenePanel = e.nativeWindowPanel;
      ipc_1.PanelIpc.setEngineView(e.$.scene);
    } else {
      console.error("PanelManager register failed:without nativeWindowPanel");
    }
  }
  get preview() {
    return this._previewPanel;
  }
  set preview(e) {
    if (e.nativeWindowPanel) {
      this._previewPanel = e.nativeWindowPanel;
    } else {
      console.error("PanelManager register failed:without nativeWindowPanel");
    }
  }
  init(e) {
    if (e) {
      Editor.Message.__protected__.addBroadcastListener(
        "scene:editor-preview-set-play",
        async (e, n) => {
          if (e === panel_constant_1.EditorPreviewState.Changing) {
            this._scenePanel.setBackgroundVisible(
              true,
              panel_constant_1.PanelBackgroundPriority.preview
            );

            this._previewPanel?.setBackgroundVisible(
              true,
              panel_constant_1.PanelBackgroundPriority.preview
            );

            this._previewPanel &&
              (this._previewPanel.setBackgroundVisible(
                true,
                panel_constant_1.PanelBackgroundPriority.preview
              ),
              this._previewPanel.enableInput(false));
          } else {
            await this.onPreviewStop(n);
          }
        }
      );

      ipc_1.PanelIpc.on("onBrowserToPanel", this.onBrowserToPanel.bind(this));
      ipc_1.PanelIpc.on("onSceneToPanel", this.onSceneToPanel.bind(this));
    }
  }
  getPanel(e) {
    return e === panel_constant_1.PanelName.Scene
      ? this._scenePanel
      : this._previewPanel;
  }
  async switchNativeWindows(e) {
    await ipc_1.PanelIpc.requestToBrowser("switchWindows", e);
  }
  resize(e, n) {
    this.getNativePanel(e)?.resize(n);
  }
  show(e) {
    this.getNativePanel(e)?.show();
  }
  hide(e) {
    this.getNativePanel(e)?.hide();
  }
  close(e) {
    this.getNativePanel(e)?.close();
  }
  getNativePanel(e) {
    return e === panel_constant_1.PanelName.Scene
      ? this._scenePanel
      : this._previewPanel;
  }
  async onBrowserToPanel(e) {
    var { panel: e, method, args, callback } = e;
    callback(await this.getNativePanel(e)?.onBrowserPanel(method, ...args));
  }
  async onSceneToPanel(e, ...n) {
    e = this.onSceneMessage[e];

    if (e) {
      e.call(this, ...n);
    }
  }
  onSceneMessage = {
    "scene:ready": () => {
      this._scenePanel.onSceneReady();
      this._previewPanel?.onSceneReady();
    },
  };
  async onPreviewStop(e = false) {
    await this.switchNativeWindows(e);

    this._scenePanel.setBackgroundVisible(
      false,
      panel_constant_1.PanelBackgroundPriority.preview
    );

    this._scenePanel.backgroundPriority =
      panel_constant_1.PanelBackgroundPriority.normal;

    if (this._previewPanel) {
      this._previewPanel.enableInput(true);

      this._previewPanel.setBackgroundVisible(
        false,
        panel_constant_1.PanelBackgroundPriority.preview
      );

      this._previewPanel.backgroundPriority =
        panel_constant_1.PanelBackgroundPriority.normal;
    }
  }
}
const ScenePanelManager = new PanelManager();
exports.ScenePanelManager = ScenePanelManager;
