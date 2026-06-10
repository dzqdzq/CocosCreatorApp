var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebEngineView = undefined;
const panel = require("@editor/panel");
const base_view_1 = require("../base-view");
const index_1 = __importDefault(require("../../ipc/index"));
const message_1 = require("../../ipc/message");
const tasks_1 = __importDefault(require("../../tasks"));
const device_adapter_1 = require("../../../script/utils/device-adapter");
const float_window_1 = __importDefault(require("../../plugin/float-window"));
const infobar_1 = __importDefault(require("../../plugin/infobar"));
const preview_client_1 = require("./preview-client");
const editor_client_1 = require("./editor-client");
const panel_constant_1 = require("../../../panel/panel-constant");
class WebEngineView extends base_view_1.BaseView {
  $scene = new editor_client_1.EditorClient();
  previewClient = new preview_client_1.PreviewClient();
  isPreviewEnabled = false;
  _lastSceneJson = "";
  _platform = "";
  _enableMiniPreview = true;
  constructor() {
    super();
  }
  async init() {
    await this.$scene.load(this);
    this.ipc = new index_1.default(this.$scene.ipc);
    super.init();

    Object.keys(message_1.EngineViewIPCMessages).forEach((e) => {
      this.$scene.ipc?.on?.(e, message_1.EngineViewIPCMessages[e].bind(this));
    });

    if (Editor.Startup.__protected__.ready.package) {
      this.depend.finish(tasks_1.default.editorInit[0]);
    } else {
      Editor.Startup.__protected__.once("package-ready", () => {
        this.depend.finish(tasks_1.default.editorInit[0]);
      });
    }

    if (await this.depend.execute(tasks_1.default.assetDbReady[0])) {
      this.depend.finish(tasks_1.default.assetDbReady[0]);
    }

    if (await this.depend.execute(tasks_1.default.packerDriverReady[0])) {
      this.depend.finish(tasks_1.default.packerDriverReady[0]);
    }

    this.info = await this.depend.execute(tasks_1.default.queryEngineInfo[0]);

    this.depend.finish(tasks_1.default.queryEngineInfo[0]);
  }
  async checkAvailable(i) {
    return new Promise((e) => {
      if (this.isPreviewEnabled === i) {
        e(false);
      }

      this.previewClient.checkAvailable().then(e);
    });
  }
  focus() {
    if (device_adapter_1.WebAdapter.enable) {
      this.previewClient.webview.focus();
    }
  }
  async previewSetPlay(e) {
    this._showLoading();

    if (!(await this.checkAvailable(e))) {
      this._hideLoading();
      return false;
    }

    this._broadcastPreviewState(
      panel_constant_1.EditorPreviewState.Changing,
      e
    );
    var i = await this._changePreviewState(e);

    if (i) {
      this.isPreviewEnabled = e;
      this._setPreviewMenuVisible(e);
      this._switchWebviewVisibility(e);
      this._updateTitle(e);

      this._broadcastPreviewState(
        e
          ? panel_constant_1.EditorPreviewState.Start
          : panel_constant_1.EditorPreviewState.Stop,
        e
      );
    }

    this._hideLoading();
    return i;
  }
  async _changePreviewState(e) {
    if (e) {
      await this.callSceneMethod("saveSceneConfig");

      var i =
        (await this.callSceneMethod("querySceneSerializedData", [])) || "";

      var [t, ,] =
        ((this._lastSceneJson = i),
        (this._enableMiniPreview = false),
        await this.callSceneMethod("beforePreview", []),
        await this.callEditorPreviewMethod("start"));

      if (t) {
        console.error("Preview Error:", t);
        return false;
      }
      this.ipc.setPreviewIpcEnabled(true);
      await this.callSceneMethod("changePreviewPlayState", [e, i]);
      await this.previewUpdateConfig();
    } else {
      await this.callSceneMethod("changePreviewPlayState", [e]);
      this.ipc.setPreviewIpcEnabled(false);
      await this.callSceneMethod("afterPreview", []);
      this._enableMiniPreview = true;
      await this.callSceneMethod("softReloadScene", []);
      this.callSceneMethod("forceUpdatePlugin", []);
      this.previewClient.reload();
      this._lastSceneJson = "";
    }
    return true;
  }
  _switchWebviewVisibility(e) {
    if (e) {
      this.$scene.hide();
      this.callSceneMethod("changeSceneViewVisible", [false]);
    } else {
      this.$scene.show();
      this.previewClient.hide();
      this.callSceneMethod("changeSceneViewVisible", [true]);
    }
  }
  _updateTitle(e) {
    var i = panel.queryInfo("scene");
    i.userData.title = e ? "i18n:scene.preview_title" : "i18n:scene.title";
    panel.changeUserData("scene", i.userData);
  }
  _setPreviewMenuVisible(e) {
    this._enableMiniPreview = !e;
    this._gameViewService.setGameViewVisible(e);
    device_adapter_1.WebAdapter.enable = e;

    if (this.__plugin_info__) {
      this.updatePlugin(this.__plugin_info__);
    }

    if (e) {
      this.previewUpdateStyle();
    } else {
      this.resetStyle();
    }
  }
  async previewUpdateStyle() {
    var e = await this._gameViewService.getGameViewData();
    if (await this._gameViewService.showGameView()) {
      device_adapter_1.WebAdapter.reset(this.offsetWidth, this.offsetHeight);
      return this.previewClient.updateStyle(e);
    }
  }
  resetStyle() {
    this.previewClient.resetStyle();
  }
  async previewUpdateConfig() {
    var { fps, stats } = await this._gameViewService.getGameViewData();
    await this.callSceneMethod("callPreviewPlayMethod", ["setFps", fps]);
    await this.callSceneMethod("callPreviewPlayMethod", ["showState", stats]);
  }
  async previewCallMethod(e, ...i) {
    if (e === "pause") {
      if (i[0]) {
        this._setPreviewMenuVisible(false);
      } else {
        this._setPreviewMenuVisible(true);
        this.previewUpdateConfig();
      }
    } else if (e === "setPlatform") {
      var [t] = i;
      if (t === this._platform) {
        return;
      }

      if (t === "gameView") {
        this._loadPreview();
      } else {
        this._unloadPreview();
      }

      this._platform = t;
    }
    return this.callSceneMethod("callPreviewPlayMethod", [e, ...i]);
  }
  _loadPreview() {
    this.previewClient.load(this);
    this.ipc.setPreviewIpc(this.previewClient.ipc);

    Object.keys(message_1.EngineViewIPCMessages).forEach((e) => {
      this.previewClient.ipc?.on(
        e,
        message_1.EngineViewIPCMessages[e].bind(this)
      );
    });
  }
  _unloadPreview() {
    this.previewClient.unload(this);
    this._hideLoading();
    this.isPreviewEnabled = false;
  }
  async callEditorPreviewMethod(e, t = []) {
    return new Promise((i) => {
      this.previewClient.ipc
        .send("call-method", {
          module: "EditorPreview",
          handler: e,
          params: t,
          queue: true,
          timeout: false,
        })
        .then((e) => {
          i([null, e]);
        })
        .catch((e) => {
          i([e, null]);
        });
    });
  }
  _showLoading() {
    Editor.Message.broadcast("scene:show-loading");
  }
  _hideLoading() {
    Editor.Message.broadcast("scene:hide-loading");
  }
  _broadcastPreviewState(e, i) {
    Editor.Message.broadcast("scene:editor-preview-set-play", e, i);
  }
  onClose() {
    this.$scene.webview.closeDevTools();
    super.onClose();
  }
  updatePlugin(e) {
    if (this._enableMiniPreview) {
      super.updatePlugin(e);
    } else {
      this.__plugin_info__ = e;
      float_window_1.default.isHidden() || float_window_1.default.unselect();
      infobar_1.default.update(e, [], {});
    }
  }
}
exports.WebEngineView = WebEngineView;
