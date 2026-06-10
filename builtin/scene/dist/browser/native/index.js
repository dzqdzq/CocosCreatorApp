Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeManager = undefined;
const native_window_browser_1 = require("./window/native-window-browser");
const electron_1 = require("electron");
const ipc_1 = require("./ipc");
const panel_constant_1 = require("../../panel/panel-constant");
class NativeManager {
  constructor() {
    this.initEvent();
  }
  _mainWindow = {};
  _panelToWindow = {};
  _sceneReady = false;
  _previewReady = false;
  _isPreview = false;
  onEngineReady(n) {
    if (n) {
      this._previewReady = true;
    } else {
      this._sceneReady = true;
    }

    this.forEachWindow((e) => {
      e.initWindows(n);
    });
  }
  onEngineClose(n) {
    if (n) {
      this._previewReady = false;
    } else {
      this._sceneReady = false;
    }

    this.forEachWindow((e) => {
      e.releaseWindows(n);
    });
  }
  onPanelReady(e, n, i) {
    if (!this._mainWindow[e]) {
      if ((a = electron_1.BrowserWindow.fromId(e))) {
        a = new native_window_browser_1.NativeWindowBrowser(a);
        this._mainWindow[e] = a;
      }
    }

    var a = this._mainWindow[e];
    a.onPanelReady(n, i);
    this._panelToWindow[n] = a;

    if (this._sceneReady) {
      a.initWindows();
    }

    if (this._previewReady) {
      a.initWindows(true);
    }
  }
  async onPanelResize(e, n, i) {
    e = this._mainWindow[e];

    if (e) {
      await e.onPanelResize(n, i);
    }
  }
  onPanelBeforeClose(e, n) {
    e = this._mainWindow[e];

    if (e) {
      e.onPanelClose(n);
    }

    if (n === panel_constant_1.PanelName.Scene) {
      this._previewReady = false;
      this._sceneReady = false;
    }
  }
  onPanelClose(e, n) {
    e = this._mainWindow[e];

    if (e) {
      e.onPanelClose(n);
    }

    if (n === panel_constant_1.PanelName.Scene) {
      this._previewReady = false;
      this._sceneReady = false;
    }
  }
  async onPanelShow(e, n) {
    e = this._mainWindow[e];

    if (e) {
      await e.onPanelShow(n);
    }
  }
  async onPanelHide(e, n) {
    e = this._mainWindow[e];

    if (e) {
      await e.onPanelHide(n);
    }
  }
  async forEachWindow(n) {
    var i = Object.values(this._mainWindow);
    for (let e = 0; e < i.length; e++) {
      await n(i[e]);
    }
  }
  initEvent() {
    ipc_1.b2sIpc.bind();
    ipc_1.b2sIpc.on("onEngineReady", this.onEngineReady.bind(this));
    ipc_1.b2sIpc.on("onEngineClose", this.onEngineClose.bind(this));
  }
  onSceneReady() {
    var e = this._panelToWindow[panel_constant_1.PanelName.Preview];

    if (e) {
      e.showCameraOnPreviewPanel();
    }

    this.forEachWindow((e) => {
      e.setPanelBackgroundVisible(false);
    });
  }
  async switchWindows(n) {
    this._isPreview = n;
    var i = Object.values(this._mainWindow);
    for (let e = 0; e < i.length; e++) {
      await i[e].switchWindows(n);
    }
  }
}
const instance = new NativeManager();
exports.NativeManager = instance;
