var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, i, n, t = n) => {
        var s = Object.getOwnPropertyDescriptor(i, n);

        if (
          !s ||
          (!("get" in s) ? !s.writable && !s.configurable : i.__esModule)
        ) {
          s = {
            enumerable: true,
            get() {
              return i[n];
            },
          };
        }

        Object.defineProperty(e, t, s);
      }
    : (e, i, n, t) => {
        e[(t = t === undefined ? n : t)] = i[n];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, i) => {
        Object.defineProperty(e, "default", { enumerable: true, value: i });
      }
    : (e, i) => {
        e.default = i;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var s = (e) =>
      (s =
        Object.getOwnPropertyNames ||
        ((e) => {
          var i;
          var n = [];
          for (i in e) {
            if (Object.prototype.hasOwnProperty.call(e, i)) {
              n[n.length] = i;
            }
          }
          return n;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var i = {};
      if (e != null) {
        for (var n = s(e), t = 0; t < n.length; t++) {
          if (n[t] !== "default") {
            __createBinding(i, e, n[t]);
          }
        }
      }
      __setModuleDefault(i, e);
      return i;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeWindowBrowser = undefined;
const path = __importStar(require("path"));
let SceneWindowClass;
const addonRoot = path.join(Editor.App.path, "../tools/native-scene");
const isWin32 = process.platform === "win32";
const NativeManager = require(path.join(
  addonRoot,
  "addon"
)).NativeEngineManager;

SceneWindowClass = isWin32
  ? require("./win32/scene-window").Win32SceneWindow
  : require("./mac/scene-window").MacSceneWindow;

const electron_1 = require("electron");

const panel_constant_1 = require("../../../panel/panel-constant");
const ipc_1 = require("../ipc");
class NativeWindowBrowser {
  _windowHandle;
  _window;
  _nativeManager;
  _previewWindows = {};
  _sceneWindows = {};
  _isPreview = false;
  _panelMap = {};
  constructor(e) {
    this._window = e;
    this._windowHandle = e.getNativeWindowHandle();
    this._initEvents();
    this._nativeManager = new NativeManager();
    this._nativeManager.init(this._windowHandle, 800, 600);
  }
  _initEvents() {
    if (isWin32) {
      electron_1.powerMonitor.on("unlock-screen", () => {
        console.log("unlock");
        this.redraw(this._isPreview);
      });
    }

    this._window.on("restore", () => {
      this.redraw(this._isPreview);
    });

    this._window.on("focus", () => {
      this.redraw(this._isPreview);
    });

    this._window.on("move", () => {
      this.redraw(this._isPreview);
    });

    this._window.on("resized", () => {
      this.redraw(this._isPreview);
    });
  }
  async initWindows(s = false) {
    [
      panel_constant_1.PanelName.Scene,
      panel_constant_1.PanelName.Preview,
    ].forEach(async (e) => {
      var i;
      var n;
      var t;

      if (
        this._panelMap[e] &&
        !(s ? this._previewWindows : this._sceneWindows)[e]
      ) {
        n = this._panelMap[e];
        this.redraw(false);

        await (t = new SceneWindowClass(
          this._nativeManager,
          this._windowHandle,
          e,
          s
        )).init(n);

        s && ((t.previewProcess = true), t.setVisible(false));

        e !== panel_constant_1.PanelName.Preview ||
          s ||
          (await this.showCameraOnPreviewPanel());

        i[e] = t;
      }
    });
  }
  releaseWindows(e = false) {
    if (e) {
      this._previewWindows = {};
    } else {
      this._sceneWindows = {};
    }
  }
  onPanelReady(e, i) {
    this._panelMap[e] = i;
  }
  onPanelClose(e) {
    if (this._previewWindows[e]) {
      this._previewWindows[e].close();
      delete this._previewWindows[e];
    }

    if (this._sceneWindows[e]) {
      this._sceneWindows[e].close();
      delete this._sceneWindows[e];
    }

    delete this._panelMap[e];
  }
  async onPanelResize(e, i) {
    if (this._panelMap[e]) {
      this._panelMap[e] = i;
    }

    e = this.getSceneWindow(e);
    if (e) {
      return e.resize(i);
    }
  }
  async onPanelShow(e) {
    await this.getSceneWindow(e)?.setVisible(true);
  }
  async onPanelHide(e) {
    await this.getSceneWindow(e, false)?.setVisible(false);
    await this.getSceneWindow(e, true)?.setVisible(false);
  }
  async switchWindows(e) {
    var i;
    var n;

    if (this._isPreview !== e) {
      i = (this._isPreview = e) ? this._previewWindows : this._sceneWindows;
      n = e ? this._sceneWindows : this._previewWindows;
      e || (await this.showCameraOnPreviewPanel());
      await this.setWindowsVisible(i, true);
      await this.setWindowsVisible(n, false);
      await this.redraw(e);
    }
  }
  async setWindowsVisible(i, n) {
    var t = Object.keys(i);
    for (let e = 0; e < t.length; e++) {
      var s = t[e];
      var a = this._panelMap[s];
      var s = i[s];

      if (n) {
        await s.setVisible(true);
        await s.resize(a);
      } else {
        await s.setVisible(false);
      }
    }
  }
  async redraw(e) {
    return e
      ? ipc_1.b2sIpc.requestToPreview("redraw")
      : ipc_1.b2sIpc.requestToScene("redraw");
  }
  getSceneWindow(e, i) {
    let n = this._isPreview;
    return (
      (n = i !== undefined ? i : n) ? this._previewWindows : this._sceneWindows
    )[e];
  }
  async showCameraOnPreviewPanel() {
    var e = this.getSceneWindow(panel_constant_1.PanelName.Preview);

    if (e) {
      e = await e.redirectTargetWindow();

      await ipc_1.b2pIpc.request(
        panel_constant_1.PanelName.Preview,
        "setCameraInvalid",
        e === 0
      );
    }
  }
  async setPanelBackgroundVisible(i) {
    await this.redraw(this._isPreview);

    Object.keys(this._panelMap).forEach((e) => {
      ipc_1.b2pIpc.send(e, "setBackgroundVisible", i);
    });
  }
}
exports.NativeWindowBrowser = NativeWindowBrowser;
