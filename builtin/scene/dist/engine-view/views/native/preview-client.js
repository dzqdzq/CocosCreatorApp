var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativePreviewClient = undefined;
const join = require("path").join;
const scene_native_ipc_1 = __importDefault(
  require("../../ipc/scene-native-ipc")
);
const utils_1 = require("../../../script/utils/ipc/utils");
const remote_1 = require("@electron/remote");
const base_client_1 = require("../base-client");

const previewPreload = join(
  __dirname,
  "../../../script/3d/preload/native/preview.js"
);

const previewURL =
  "packages://scene/static/template/3d-webview.html?url=" +
  encodeURI(previewPreload);

const PreviewMessages = {
  "preview-ready"() {
    this.isPreviewReady = true;
  },
  "preview-failed"() {
    this.isPreviewFailed = true;
  },
  "preview-close"() {
    this.isPreviewReady = false;
    this.isPreviewFailed = false;
  },
  "preview-restart"() {
    this.restart();
  },
};

class NativePreviewClient extends base_client_1.BaseClient {
  _restarting = false;
  _loaded = false;
  _isPreviewReady = false;
  _isPreviewFailed = false;
  _readyResolve = null;
  get isPreviewReady() {
    return this._isPreviewReady;
  }
  set isPreviewReady(e) {
    this._isPreviewReady = e;
    this.ipc.setReady(e);

    if (e && this._readyResolve) {
      this._readyResolve(true);
    }
  }
  get isPreviewFailed() {
    return this._isPreviewFailed;
  }
  set isPreviewFailed(e) {
    if ((this._isPreviewFailed = e) && this._readyResolve) {
      this._readyResolve(false);
    }
  }
  constructor() {
    super();
  }
  preventWheelScroll(e) {
    e.preventDefault();
  }
  async load(t) {
    super.load(t);
    this.webview.setAttribute("src", previewURL);

    this.webview.setAttribute(
      "style",
      "position:absolute; width:100%;height:100%;"
    );

    this.webview.addEventListener("dom-ready", () => {
      if (!this._restarting) {
        this._loaded = true;
      }

      var e = remote_1.webContents.fromId(this.webview.getWebContentsId());
      e?.setBackgroundThrottling(false);

      e?.on("render-process-gone", (e, i) => {
        if (i.reason === "crashed") {
          this.unload(t);
          this._isPreviewFailed = true;
        }
      });
    });

    this.ipc = new scene_native_ipc_1.default(
      this.webview,
      utils_1.IPCChannel.PreviewSend,
      utils_1.IPCChannel.PreviewReply
    );

    this._listerPreviewEvent();
  }
  _listerPreviewEvent() {
    Object.keys(PreviewMessages).forEach((e) => {
      this.ipc?.on?.(e, PreviewMessages[e].bind(this));
    });
  }
  unload(e) {
    if (
      this._loaded &&
      ((this.isPreviewFailed = false),
      (this.isPreviewReady = false),
      (this._loaded = false),
      this._readyResolve &&
        (this._readyResolve(false), (this._readyResolve = null)),
      this.webview.setAttribute("src", ""),
      this.webview.parentElement)
    ) {
      this.webview.parentElement.removeChild(this.webview);
    }
  }
  show() {
    this.webview.setAttribute("style", "pointer-events: none;flex:1;");
  }
  hide() {}
  async updateStyle(e) {
    return { scale: 1 };
  }
  resetStyle() {}
  async restart() {
    return new Promise((t, e) => {
      this._showLoading();
      this._restarting = true;
      this.ipc.setReady(false);
      const s = (async () => {
        this.webview.removeEventListener("did-finish-load", s);
        this.ipc.clearBuffer();
        this.ipc.setReady(true);
        var [e, i] = await this.callEditorPreviewMethod("start");
        this._restarting = false;
        this._hideLoading();

        if (e) {
          console.error("Preview Error:", e, i);
          t(false);
        } else {
          t(true);
        }
      }).bind(this);
      this.webview.addEventListener("did-finish-load", s);
      this.webview.reload();
    });
  }
  async checkAvailable() {
    return new Promise((e) => {
      if (this.isPreviewFailed) {
        console.error(Editor.I18n.t("scene.game_view.failed"));
        e(false);
      }

      if (this.isPreviewReady) {
        e(true);
      } else {
        this._readyResolve = e;
      }
    });
  }
  _showLoading() {
    Editor.Message.broadcast("scene:show-loading");
  }
  _hideLoading() {
    Editor.Message.broadcast("scene:hide-loading");
  }
}
exports.NativePreviewClient = NativePreviewClient;
