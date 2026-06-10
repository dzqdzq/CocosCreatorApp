var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, n, t, a = t) => {
        var r = Object.getOwnPropertyDescriptor(n, t);

        if (
          !r ||
          (!("get" in r) ? !r.writable && !r.configurable : n.__esModule)
        ) {
          r = {
            enumerable: true,
            get() {
              return n[t];
            },
          };
        }

        Object.defineProperty(e, a, r);
      }
    : (e, n, t, a) => {
        e[(a = a === undefined ? t : a)] = n[t];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, n) => {
        Object.defineProperty(e, "default", { enumerable: true, value: n });
      }
    : (e, n) => {
        e.default = n;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var r = (e) =>
      (r =
        Object.getOwnPropertyNames ||
        ((e) => {
          var n;
          var t = [];
          for (n in e) {
            if (Object.prototype.hasOwnProperty.call(e, n)) {
              t[t.length] = n;
            }
          }
          return t;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var n = {};
      if (e != null) {
        for (var t = r(e), a = 0; a < t.length; a++) {
          if (t[a] !== "default") {
            __createBinding(n, e, t[a]);
          }
        }
      }
      __setModuleDefault(n, e);
      return n;
    };
  })();

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.load = load;
exports.unload = unload;

const { addMultiSceneListener } = require("./multi-scene");

const ElectronModule = require("@base/electron-module");

const { join } = require("path");

const scene_cache_1 = require("./scene-cache");
const env_1 = __importDefault(require("../script/utils/env"));
let nativeManager;
const electron = require("electron");
async function load() {
  if (await env_1.default.useNativeScene()) {
    nativeManager = require("./native/index").NativeManager;
  }

  const t = {
    import: require("./protocol/import"),
    "project-temp": require("./protocol/project-temp"),
  };

  ElectronModule.register(
    "PreviewExtends",
    join(__dirname, "../preview-extends/index")
  );

  Object.keys(t).forEach((e) => {
    var n = t[e];
    require("electron").protocol[n.type](e, n.handler);
  });

  try {
    await scene_cache_1.sceneCacheManager.init();
  } catch (e) {
    console.error(e);
  }

  (
    await Promise.resolve().then(() =>
      __importStar(require("@base/electron-base-ipc"))
    )
  ).on("scene:check-ipc", (e) => true);

  addMultiSceneListener();
}
async function unload() {
  await scene_cache_1.sceneCacheManager.save();
}

electron.ipcMain.on("fire-web-contents", (e) => {
  e.sender.on("new-window", (e, n, t, a, r, c) => {
    e.preventDefault();
    Object.assign(r, { autoHideMenuBar: true });
    r = new electron.BrowserWindow(r);
    e.newGuest = r;
  });
});

exports.methods = {
  open() {
    Editor.Panel.open("scene");
  },
  async queryLatestCache(e) {
    try {
      return await scene_cache_1.sceneCacheManager.queryLatestCache(e);
    } catch (e) {
      console.error(e);
    }
  },
  async clearSceneCache(e) {
    try {
      return await scene_cache_1.sceneCacheManager.clearSceneCache(e);
    } catch (e) {
      console.error(e);
    }
  },
  async saveSceneCacheToFile() {
    try {
      return await scene_cache_1.sceneCacheManager.save();
    } catch (e) {
      console.error(e);
    }
  },
  updateCacheConfig() {
    scene_cache_1.sceneCacheManager.updateConfig();
  },
  onSceneReady(e) {
    scene_cache_1.sceneCacheManager.onSceneReady(e);
    nativeManager?.onSceneReady();
  },
  onSceneClosed() {
    scene_cache_1.sceneCacheManager.onSceneClosed();
  },
  async panelToBrowser(e, ...n) {
    if (nativeManager[e]) {
      return await nativeManager[e].call(nativeManager, ...n);
    }
    console.warn("nativeManager does not has " + e);
  },
};
