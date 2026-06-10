var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.preload = preload;
require("@editor/creator");
const log_1 = __importDefault(require("../manager/startup/log"));
function check() {
  if (require("@base/electron-base-ipc").sendSync("scene:check-ipc")) {
    startup();
  } else {
    setTimeout(() => {
      window.location.reload();
    }, 1000 /* 1e3 */);
  }
}
async function initPreview() {
  try {
    await cce.Ipc.startup();
    await cce.Startup.requireEngine();
    log_1.default.setLevel(4);
    console.info(Editor.I18n.t("scene.game_view.ready"));
    cce.Ipc.send("preview-ready");
  } catch (e) {
    console.error(Editor.I18n.t("scene.game_view.failed") + ":" + e);
    cce.Ipc.send("preview-failed");
  }
}
async function startup() {
  var e = require("path").join;
  await require("editor/preload").init();
  window.Editor = require("editor");
  Editor.Metrics.trackTimeStart("scene:scene-view-startup");
  var r = require("../manager/startup").default;
  var i = require("../manager/ipc/index").default;
  window.cce = { Startup: r, Ipc: i };

  if (isSceneNative) {
    r = require("./native/native-scene").default;
    cce.NativeScene = r;
  }

  window.AppModulePath = e(Editor.App.path, "node_modules");

  if (isPreviewProcess) {
    r = require("./editor-preview").default;
    cce.EditorPreview = r;
    log_1.default.changePrefix("PreviewInEditor");
    log_1.default.setLevel(2);
    initPreview();
  } else {
    i.send("ready");
  }

  Editor.Message.send(
    "process",
    "register-process-info",
    process.pid,
    "webview:scene-web"
  );
}
function preload(e) {
  window.isSceneNative = e.isSceneNative;
  window.isPreviewProcess = e.isPreviewProcess;
  check();
  let i = 0;

  window.addEventListener("beforeunload", async (e) => {
    var r;

    if (isSceneNative) {
      cce.NativeScene.sendToBrowser("onEngineClose", isPreviewProcess);
    }

    if (isPreviewProcess) {
      cce.Ipc.send("preview-close");
    } else {
      r = require("../manager/ipc/index").default;

      i === 1
        ? (e.returnValue = true)
        : (cce.Scene &&
            r.send("immediately-dump", cce.SceneFacadeManager.dumpAllScenes()),
          r.send("close"));
    }
  });

  require("electron").ipcRenderer.send("fire-web-contents");
}
