var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviewClient = undefined;
const join = require("path").join;
const scene_web_ipc_1 = __importDefault(require("../../ipc/scene-web-ipc"));
const utils_1 = require("../../../script/utils/ipc/utils");
const device_adapter_1 = require("../../../script/utils/device-adapter");
const base_client_1 = require("../base-client");
const remote_1 = require("@electron/remote");

const { debounce } = require("lodash");

const previewPreload = join(
  __dirname,
  "../../../script/3d/preload/web/preview.js"
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

class PreviewClient extends base_client_1.BaseClient {
  _restarting = false;
  _loaded = false;
  _isPreviewReady = false;
  _isPreviewFailed = false;
  _readyResolve = null;
  _resizeDebounce;
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
    this._resizeDebounce = debounce(this.setSize, 120);
  }
  setSize(e, t) {
    if (
      this._loaded &&
      this.webview.hasAttribute("update-style") &&
      (this.webview.setAttribute("style", `width:${e}px; height:${t}px;`),
      this.webview.removeAttribute("update-style"),
      requestAnimationFrame(() => {
        device_adapter_1.WebAdapter.offsetX = this.webview.offsetLeft;
        device_adapter_1.WebAdapter.offsetY = this.webview.offsetTop;
      }),
      this.webview.parentElement)
    ) {
      this.webview.parentElement.setAttribute("game-view", "");

      this.webview.parentElement.addEventListener(
        "wheel",
        this.preventWheelScroll
      );
    }
  }
  preventWheelScroll(e) {
    e.preventDefault();
  }
  async load(e) {
    super.load(e);
    this.webview.setAttribute("src", previewURL);

    this.webview.setAttribute(
      "style",
      `position:absolute; width:${device_adapter_1.WebAdapter.screenWidth}px;height:${device_adapter_1.WebAdapter.screenHeight}px;`
    );

    this.webview.addEventListener("did-finish-load", () => {
      this.updateZoomFactor();
    });

    this.webview.addEventListener("dom-ready", () => {
      if (!this._restarting) {
        this.webview.setAttribute("style", "display:none");
        this._loaded = true;
      }

      remote_1.webContents
        .fromId(this.webview.getWebContentsId())
        ?.setBackgroundThrottling(false);
    });

    this.ipc = new scene_web_ipc_1.default(
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
    if (this._loaded) {
      this.isPreviewFailed = false;
      this.isPreviewReady = false;
      this._loaded = false;

      this._readyResolve &&
        (this._readyResolve(false), (this._readyResolve = null));

      this.webview.setAttribute("src", "");
      this.webview.reload();
      e.removeChild(this.webview);
    }
  }
  show() {}
  hide() {
    this.webview.setAttribute("style", "display: none");
  }
  async updateStyle(e) {
    var { rotate: e, scaleValue, devicesInfo, fullScreen } = e;

    let { width, height } = devicesInfo;

    switch (devicesInfo.type) {
      case "ratio":
        d = device_adapter_1.WebAdapter.ratioToSize(width, height);
        width = d.width;
        height = d.height;
        break;
      case "design":
        d = await Editor.Profile.getProject(
          "project",
          "general.designResolution"
        );

        width = d.width;
        height = d.height;

        break;
      case "free":
        width =
          device_adapter_1.WebAdapter.screenWidth * window.devicePixelRatio;
        height =
          device_adapter_1.WebAdapter.screenHeight * window.devicePixelRatio;
        break;
    }

    device_adapter_1.WebAdapter.fitScreen(
      width,
      height,
      fullScreen,
      e,
      scaleValue / 100
    );
    var d = Math.floor(device_adapter_1.WebAdapter.width);
    var devicesInfo = Math.floor(device_adapter_1.WebAdapter.height);
    this.webview.setAttribute("update-style", "");
    this._resizeDebounce(d, devicesInfo);
    return { scale: Math.floor(100 * device_adapter_1.WebAdapter.scale) };
  }
  resetStyle() {
    this.webview.removeAttribute("update-style");
    this.webview.setAttribute("style", "pointer-events: none;flex:1;");

    if (this.webview.parentElement) {
      this.webview.parentElement.removeAttribute("game-view");

      this.webview.parentElement.removeEventListener(
        "wheel",
        this.preventWheelScroll
      );
    }
  }
  async restart() {
    return new Promise((i, e) => {
      this._showLoading();
      this._restarting = true;
      this.ipc.setReady(false);
      const s = (async () => {
        this.webview.removeEventListener("did-finish-load", s);
        this.ipc.clearBuffer();
        this.ipc.setReady(true);
        var [e, t] = await this.callEditorPreviewMethod("start");
        this._restarting = false;
        this._hideLoading();

        if (e) {
          console.error("Preview Error:", e, t);
          i(false);
        } else {
          i(true);
        }
      }).bind(this);
      this.webview.addEventListener("did-finish-load", s);
      this.webview.reload();
    });
  }
  async checkAvailable() {
    return new Promise((e) => {
      if (this.isPreviewFailed) {
        console.info(Editor.I18n.t("scene.game_view.failed"));
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
exports.PreviewClient = PreviewClient;
