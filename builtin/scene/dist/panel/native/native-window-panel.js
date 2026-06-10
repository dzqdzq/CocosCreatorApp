var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, i, n = i) => {
        var r = Object.getOwnPropertyDescriptor(t, i);

        if (
          !r ||
          (!("get" in r) ? !r.writable && !r.configurable : t.__esModule)
        ) {
          r = {
            enumerable: true,
            get() {
              return t[i];
            },
          };
        }

        Object.defineProperty(e, n, r);
      }
    : (e, t, i, n) => {
        e[(n = n === undefined ? i : n)] = t[i];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var r = (e) =>
      (r =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var i = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              i[i.length] = t;
            }
          }
          return i;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var i = r(e), n = 0; n < i.length; n++) {
          if (i[n] !== "default") {
            __createBinding(t, e, i[n]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeWindowPanel = undefined;
const remote = __importStar(require("@electron/remote"));
const panel_constant_1 = require("../panel-constant");

const { debounce } = require("lodash");

const { registerInput, enableInput } = require("./preview-input");

const ipc_1 = require("./ipc");
const isWin32 = process.platform === "win32";
const EPSILON = 0.0001; /* 1e-4 */
function checkRect(e, t) {
  return (
    Math.abs(e.width - t.width) < EPSILON &&
    Math.abs(e.height - t.height) < EPSILON &&
    Math.abs(e.x - t.x) < EPSILON &&
    Math.abs(e.y - t.y) < EPSILON
  );
}
class NativeWindowPanel {
  panel;
  panelName = panel_constant_1.PanelName.Default;
  browserWindowId = 0;
  isShow = true;
  cameraInvalid = false;
  rect;
  background;
  _sceneReady = false;
  _debounceResize;
  _backgroundPriority = panel_constant_1.PanelBackgroundPriority.normal;
  constructor(e, t) {
    this.panel = e;
    this.panelName = t;
    this.rect = { x: 0, y: 0, width: 0, height: 0 };
    e = remote.getCurrentWindow();
    this.browserWindowId = e.id;

    this._debounceResize = debounce(this._resize, 100, {
      trailing: true,
    });

    this.init();
  }
  init() {
    this.createBackground();

    if (this.panelName === panel_constant_1.PanelName.Preview) {
      registerInput(this.panel.$.preview, this);
    }
  }
  createBackground() {
    this.background = document.createElement("div");

    this.background.setAttribute(
      "style",
      "position:absolute;background:#262626;width:100%;height:100%"
    );

    this.panel.$.content.appendChild(this.background);
  }
  get backgroundPriority() {
    return this._backgroundPriority;
  }
  set backgroundPriority(e) {
    this._backgroundPriority = e;
  }
  setBackgroundVisible(e, t = panel_constant_1.PanelBackgroundPriority.normal) {
    if (this._sceneReady && this._backgroundPriority <= t) {
      this._backgroundPriority = t;

      e
        ? this.background.setAttribute(
            "style",
            "position:absolute;background:#262626;width:100%;height:100%"
          )
        : this.cameraInvalid ||
          this.background.setAttribute("style", "display: none");
    }
  }
  enableInput(e) {
    enableInput(e);
  }
  getRect() {
    var e = this.panel.$.content.getBoundingClientRect();
    var t = isWin32 ? window.devicePixelRatio : 1;
    return {
      x: e.left * t,
      y: (isWin32 ? e.top : window.innerHeight - e.bottom) * t,
      width: e.width * t,
      height: e.height * t,
    };
  }
  onSceneReady() {
    this._sceneReady = true;
  }
  onPanelReady() {
    ipc_1.PanelIpc.sendToBrowser(
      "onPanelReady",
      this.browserWindowId,
      this.panelName,
      this.getRect()
    );
  }
  async _resize(e) {
    await ipc_1.PanelIpc.requestToBrowser(
      "onPanelResize",
      this.browserWindowId,
      this.panelName,
      e
    );

    this.setBackgroundVisible(false);
  }
  resize(e) {
    if (this.isShow && !checkRect((e = e || this.getRect()), this.rect)) {
      this.rect = e;
      this.setBackgroundVisible(true);
      this._debounceResize(e);
    }
  }
  close() {
    this._sceneReady = false;

    ipc_1.PanelIpc.sendToBrowser(
      "onPanelClose",
      this.browserWindowId,
      this.panelName
    );
  }
  beforeClose() {
    ipc_1.PanelIpc.sendToBrowser(
      "onPanelBeforeClose",
      this.browserWindowId,
      this.panelName
    );
  }
  async show() {
    if (!this.isShow) {
      this.isShow = true;
      this.setBackgroundVisible(true);

      await ipc_1.PanelIpc.requestToBrowser(
        "onPanelShow",
        this.browserWindowId,
        this.panelName
      );

      this.setBackgroundVisible(false);
    }
  }
  async hide() {
    if (this.isShow) {
      this.isShow = false;

      await ipc_1.PanelIpc.requestToBrowser(
        "onPanelShow",
        this.browserWindowId,
        this.panelName
      );
    }
  }
  onBrowserPanel(e, ...t) {
    if (this[e]) {
      this[e].call(this, ...t);
    }
  }
  setCameraInvalid(e) {
    if (e) {
      this.setBackgroundVisible(true);
      this.cameraInvalid = true;
    } else {
      this.cameraInvalid = false;
      this.setBackgroundVisible(false);
    }
  }
}
exports.NativeWindowPanel = NativeWindowPanel;
