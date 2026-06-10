var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeEditorClient = undefined;
const join = require("path").join;
const scene_web_ipc_1 = __importDefault(require("../../ipc/scene-web-ipc"));
const utils_1 = require("../../../script/utils/ipc/utils");
const remote_1 = require("@electron/remote");
const base_client_1 = require("../base-client");
const preloadPath = join(
  __dirname,
  "../../../script/3d/preload/native/preload.js"
);

const sourceUrl =
  "packages://scene/static/template/3d-webview.html?url=" +
  encodeURI(preloadPath);

class NativeEditorClient extends base_client_1.BaseClient {
  info;
  _loaded = false;
  constructor() {
    super();
  }
  load(e) {
    super.load(e);

    Editor.Metrics._trackEventWithTimer({
      category: "native-scene",
      id: "A100001",
      value: 1,
    });

    this.webview.setAttribute("style", "pointer-events: none;flex:1;");
    this.webview.setAttribute("src", sourceUrl);
    let t = false;

    this.webview.addEventListener("dom-ready", () => {
      var e;

      if (!t) {
        t = true;

        console.debug(
          "Scene view web contents ID: " + this.webview.getWebContentsId()
        );

        (e = remote_1.webContents.fromId(
          this.webview.getWebContentsId()
        ))?.setBackgroundThrottling(false);

        e?.on("render-process-gone", async (e, t) => {
          var i;
          var s;

          Editor.Message.broadcast("crash-reporter:report", {
            process: "Scene Native View",
            value: { A100000_3D_Engine_Native: 1 },
            details: t,
            time: new Date(),
          });

          if (t.reason === "crashed") {
            base_client_1.BaseClient.isCrash = true;
            i = NativeEditorClient.createDateInfo();
            await NativeEditorClient.addCrashToProfile(i);
            s = NativeEditorClient.getCrashTimeOfTenMin(i);

            (NativeEditorClient.getCrashTimesOfDay(i) !== 3 && s !== 2) ||
              ((
                await Editor.Dialog.warn(
                  Editor.I18n.t("scene.crash.dialog.native_crash.message"),
                  {
                    buttons: [
                      Editor.I18n.t(
                        "scene.crash.dialog.native_crash.switch_to_ts"
                      ),
                      Editor.I18n.t("scene.crash.dialog.native_crash.continue"),
                    ],
                    default: 1,
                    cancel: 1,
                  }
                )
              ).response === 0 &&
                (await Editor.Profile.setConfig(
                  "scene",
                  "scene.native-engine",
                  false,
                  "global"
                )));

            console.debug(
              `The scene process has crashed. Exit code: ${t.exitCode.toString(
                16
              )}(${t.exitCode})`
            );
          }
        });
      }
    });

    this.ipc = new scene_web_ipc_1.default(
      this.webview,
      utils_1.IPCChannel.NativeSend,
      utils_1.IPCChannel.NativeReply
    );
  }
  unload(e) {
    if (this._loaded) {
      this.webview.setAttribute("src", "");
      this.webview.reload();
      e.removeChild(this.webview);
    }
  }
  show() {
    this.webview.setAttribute("style", "pointer-events: none;flex:1;");
  }
  hide() {
    this.webview.setAttribute("style", "display: none");
  }
}
exports.NativeEditorClient = NativeEditorClient;
