var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, i, n = i) => {
        Object.defineProperty(e, n, {
          enumerable: true,
          get() {
            return t[i];
          },
        });
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
  ((e) => {
    if (e && e.__esModule) {
      return e;
    }
    var t = {};
    if (e != null) {
      for (var i in e) {
        if (i !== "default" && Object.prototype.hasOwnProperty.call(e, i)) {
          __createBinding(t, e, i);
        }
      }
    }
    __setModuleDefault(t, e);
    return t;
  });

Object.defineProperty(exports, "__esModule", { value: true });
exports.NativizeConstants = undefined;
exports.Nativize = undefined;
let nativeManager;
const path = __importStar(require("path"));
const addonRoot = path.join(Editor.App.path, "../tools/native-scene");

nativeManager = (
  process.platform === "win32"
    ? require(path.join(addonRoot, "addon"))
    : process.arch === "arm64"
    ? require(path.join(addonRoot, "addon_arm64"))
    : require(path.join(addonRoot, "addon_x86"))
).NativeEngineManager;

const editorServer = require("./server");

const ipc = require("@base/electron-base-ipc");
const SceneWindow = require("./scene-window");
const constants_1 = require("./constants");

Object.defineProperty(exports, "NativizeConstants", {
  enumerable: true,
  get() {
    return constants_1.NativizeConstants;
  },
});

const child_process_1 = require("child_process");

let id = 1;
let restartable = true;
let nodeInspectPort;
let nodeInspectID;
ipc.on("editor-lib-nativize:inspect-info", (e) => {
  e.reply(0, { id: nodeInspectID, port: nodeInspectPort });
});
class Nativize {
  constructor() {
    this.port = 0;
    this.appConnect = false;
    this.appStarting = false;
    this.manager = new nativeManager();
    this.server = new editorServer();

    this.server.on("connect", () => {
      console.log("native app connected");
      this.appConnect = true;
      this.restartAppTimes = 0;
      id = 1;

      if (this.onFuncMaps.connect) {
        this.onFuncMaps.connect(true);
      }

      this.appStarting = false;
    });

    this.server.on("close", () => {
      console.log("server close");
      this.appConnect = false;
      this.nativeAPPConnectTimeout();
      Editor.Message.send("scene", "native-ipc", "close");
    });

    this.onFuncMaps = {};
    this.restartAppTimes = 0;
  }
  onWindowCallback(e, t, i) {
    e = this.onFuncMaps[e];

    if (e) {
      e(t, i);
    }
  }
  init(e, t, i) {
    this.server.startServer(this.port);
    this.parentWindow = this.manager.init(e, t, i);

    if (this.parentWindow) {
      this.parentWindow.setWindowCallback(this.onWindowCallback.bind(this));
    } else {
      console.error("editorNative init fail");
    }
  }
  setMinWindowSize(e, t) {
    this.manager.setMinWindowSize(e, t);
  }
  setMainWindowSize(e, t) {
    this.mainSceneWidth = e;
    this.mainSceneHeight = t;
  }
  on(e, t) {
    this.onFuncMaps[e] = t;
  }
  nativeAPPConnectTimeout() {
    if (this.connectTimeoutID) {
      clearTimeout(this.connectTimeoutID);
    }

    this.connectTimeoutID = setTimeout(() => {
      if (!this.appConnect) {
        console.log(
          "native app failed to connect editor in 5s,restart now",
          new Date()
        );

        this.restartNativeApp();
      }

      this.connectTimeoutID = null;
    }, 5000 /* 5e3 */);
  }
  getAppPath() {
    var e = process.platform === "darwin";
    var t = path.join(Editor.App.path, "../tools/node");
    return path.join(t, e ? "bin/node" : "node.exe");
  }
  restartNativeApp() {
    if (restartable) {
      this.nativeApp &&
        (this.nativeApp.removeAllListeners(),
        this.nativeApp.kill(),
        (this.nativeApp = null));

      this.restartAppTimes < 10
        ? (console.log(`restartNativeApp at ${this.restartAppTimes} times`),
          this.startNativeApp([]))
        : console.error("try too much times for start native process");

      this.restartAppTimes++;
    }
  }
  startNativeApp(e) {
    this.appStarting = true;
    this.nativeAPPConnectTimeout();
    var t = this.getAppPath();
    var i = process.platform === "darwin";
    var n = path.join(t, "../../../resources/3d/editor-native-scene/build");

    var n = i
      ? path.join(t, "../../../../resources/3d/editor-native-scene/build")
      : n;

    console.log("appPath", t, n);
    var i = e || ["--inspect"];
    i.push("./index.js");
    i.push("port=" + this.server.getPort());
    this.nativeApp = child_process_1.execFile(t, i, { cwd: n });

    if (null != (e = this.nativeApp)) {
      e.stdout.on("data", (e) => {
        console.log("[native stdout]: " + e);
      });
    }

    if (null != (t = this.nativeApp)) {
      t.stderr.on("data", (e) => {
        var t;

        if (e.includes("Debugger listening on")) {
          t = e.indexOf("\n");
          t = e.slice(22, t);
          nodeInspectPort = t.slice(15, 19);
          nodeInspectID = t.slice(20);
        }

        console.error("[native stderr]: " + e);
      });
    }

    this.nativeApp.on("error", (e) => {
      console.error("nativeApp on error", e.message);
      this.nativeApp = null;
      this.restartNativeApp();
    });

    this.nativeApp.on("exit", (e, t) => {
      console.error("nativeApp on exit", e, t);
      this.nativeApp = null;
      this.appStarting = false;
      this.restartNativeApp();
    });
  }
  createWindow(o, r) {
    return new Promise((n, s) => {
      this.request({
        type: constants_1.NativizeConstants.Type.newWindow,
        data: { w: 480, h: 320 },
      }).then((i) => {
        setTimeout(() => {
          console.log("send new window resolve", i.windowID);
          try {
            var e = this.manager.createWindow(o, r, i.windowID);
            var t = new SceneWindow(e, i.windowID);
            n(t);
          } catch (e) {
            s(e);
          }
        }, 2000 /* 2e3 */);
      });
    });
  }
  send(e) {
    e.id = id;
    id += 2;
    return this.server.send(e);
  }
  request(e) {
    e.id = id;
    id += 2;
    return this.server.request(e);
  }
  setTitle(e) {
    if (this.parentWindow) {
      this.parentWindow.setTitle(e);
    }
  }
  setRestartable(e) {
    restartable = e;
  }
  setPort(e) {
    this.port = e;
  }
}
const instance = new Nativize();
exports.Nativize = instance;
