var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeEngineView = undefined;
const base_view_1 = require("../base-view");
const index_1 = __importDefault(require("../../ipc/index"));
const message_1 = require("../../ipc/message");
const tasks_1 = __importDefault(require("../../tasks"));
const preview_client_1 = require("./preview-client");
const editor_client_1 = require("./editor-client");
const panel_constant_1 = require("../../../panel/panel-constant");
const ipc_1 = require("../../../panel/native/ipc");
class NativeEngineView extends base_view_1.BaseView {
  $scene = new editor_client_1.NativeEditorClient();
  previewClient = new preview_client_1.NativePreviewClient();
  isPreviewEnabled = false;
  _lastSceneJson = "";
  _platform = "";
  constructor() {
    super();
  }
  listenIpc(e) {
    if (e) {
      Object.keys(message_1.EngineViewIPCMessages).forEach((t) => {
        e.on?.(t, async (...e) => {
          ipc_1.PanelIpc.onSceneToPanel(t, ...e);
          return message_1.EngineViewIPCMessages[t].call(this, ...e);
        });
      });
    }
  }
  async init() {
    document.body.setAttribute("style", "background:#434343");
    this.$scene.load(this);
    this.ipc = new index_1.default(this.$scene.ipc);
    super.init();
    this.listenIpc(this.$scene.ipc);

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
  async checkAvailable(t) {
    return new Promise((e) => {
      if (this.isPreviewEnabled === t) {
        e(false);
      }

      this.previewClient.checkAvailable().then(e);
    });
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
    var t = await this._changePreviewState(e);

    if (t) {
      this.isPreviewEnabled = e;

      this._broadcastPreviewState(
        e
          ? panel_constant_1.EditorPreviewState.Start
          : panel_constant_1.EditorPreviewState.Stop,
        e
      );
    }

    this._hideLoading();
    return t;
  }
  async _changePreviewState(e) {
    if (e) {
      var t =
        (await this.safeCallSceneMethod("querySceneSerializedData", [])) || "";

      var [i, ,] =
        ((this._lastSceneJson = t),
        await this.callEditorPreviewMethod("start"));

      if (i) {
        console.error("Preview Error:", i);
        return false;
      }
      this.ipc.setPreviewIpcEnabled(true);
      await this.safeCallSceneMethod("changePreviewPlayState", [e, t]);
    } else {
      await this.safeCallSceneMethod("changePreviewPlayState", [e]);
      this.ipc.setPreviewIpcEnabled(false);
      await this.safeCallSceneMethod("softReloadScene", []);
      this.safeCallSceneMethod("forceUpdatePlugin", []);
      this.previewClient.reload();
      this._lastSceneJson = "";
    }
    return true;
  }
  resetStyle() {
    this.previewClient.resetStyle();
  }
  async previewUpdateConfig() {
    var { fps, stats } = await this._gameViewService.getGameViewData();
    await this.safeCallSceneMethod("callPreviewPlayMethod", ["setFps", fps]);
    await this.safeCallSceneMethod("callPreviewPlayMethod", [
      "showState",
      stats,
    ]);
  }
  async previewCallMethod(e, ...t) {
    if (e === "setPlatform") {
      var [i] = t;
      if (i === this._platform) {
        return;
      }

      if (i === "gameView") {
        await this._loadPreview();
      } else {
        await this._unloadPreview();
      }

      this._platform = i;
    }
    return this.safeCallSceneMethod("callPreviewPlayMethod", [e, ...t]);
  }
  _loadPreview() {
    this.previewClient.load(this);
    this.ipc.setPreviewIpc(this.previewClient.ipc);
    this.listenIpc(this.previewClient.ipc);
  }
  _unloadPreview() {
    this.previewClient.unload(this);
    this._hideLoading();
    this.isPreviewEnabled = false;
  }
  async restartPreview() {
    this._showLoading();

    if (await this.previewClient.restart()) {
      await this.safeCallSceneMethod("changePreviewPlayState", [
        true,
        this._lastSceneJson,
      ]);

      await this.previewUpdateConfig();
    }

    this._hideLoading();
  }
  _showLoading() {
    Editor.Message.broadcast("scene:show-loading");
  }
  _hideLoading() {
    Editor.Message.broadcast("scene:hide-loading");
  }
  async safeCallSceneMethod(i, a, e = false, s = true) {
    return new Promise((t) => {
      this.callSceneMethod(i, a, e, s)
        .then((e) => {
          t(e);
        })
        .catch((e) => {
          console.debug("safeCallSceneMethod params", i, a);

          console.error(
            `SceneMethod ${i} executed failed:
`,
            e
          );

          t(null);
        });
    });
  }
  async callEditorPreviewMethod(e, i = []) {
    return new Promise((t) => {
      this.previewClient.ipc
        .send("call-method", {
          module: "EditorPreview",
          handler: e,
          params: i,
          queue: true,
          timeout: false,
        })
        .then((e) => {
          t([null, e]);
        })
        .catch((e) => {
          t([e, null]);
        });
    });
  }
  async callNativeSceneMethod(e = false, i, ...a) {
    return new Promise((t) => {
      (e ? this.previewClient : this.$scene).ipc
        ?.send("call-method", {
          module: "NativeScene",
          handler: i,
          params: a,
          queue: true,
          timeout: false,
        })
        .then((e) => {
          t([null, e]);
        })
        .catch((e) => {
          t([e, null]);
        });
    });
  }
  _broadcastPreviewState(e, t) {
    Editor.Message.broadcast("scene:editor-preview-set-play", e, t);
  }
}
exports.NativeEngineView = NativeEngineView;
