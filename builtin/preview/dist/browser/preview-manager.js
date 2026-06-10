Object.defineProperty(exports, "__esModule", { value: true });
exports.browserPreviewManager = undefined;
exports.CURRENT_SCENE = undefined;

const { reload, close } = require("../contributions/server");

exports.CURRENT_SCENE = "current_scene";
class PreviewManager {
  _awaitScriptCompile = false;
  _awaitSceneChanged = false;
  canAutoRefresh = false;
  currentScene = "";
  _currentSceneUuid = "";
  defaultScene = "";
  _protocol = "https";
  _waitAutoLoadPromise = null;
  _waitAutoLoadTimmer = null;
  _autoReloadTimmer = null;
  _timeout = 30000 /* 3e4 */;
  async init() {
    this.canAutoRefresh = await Editor.Profile.getConfig(
      "preview",
      "general.auto_refresh"
    );

    this.defaultScene = await Editor.Profile.getConfig(
      "preview",
      "general.start_scene"
    );

    Editor.Profile.__protected__.on("change", onProfileChange);
    var e = await Editor.Message.request("server", "query-https-enabled");
    this._protocol = e ? "https" : "http";
  }
  set scriptCompiled(e) {
    this._awaitScriptCompile = !e;

    if (e) {
      this.step();
    }
  }
  set sceneChanged(e) {
    this._awaitSceneChanged = !e;

    if (e) {
      this.step();
    }
  }
  set currentSceneUuid(e) {
    this._currentSceneUuid = e;
  }
  get currentSceneUuid() {
    return this._currentSceneUuid || this.currentScene || this.defaultScene;
  }
  step() {
    if (this._waitAutoLoadPromise) {
      this._waitAutoLoadTimmer && clearTimeout(this._waitAutoLoadTimmer);
      this._load();
      this._waitAutoLoadPromise();
      this._waitAutoLoadPromise = null;
    } else if (
      this.canAutoRefresh &&
      !this._awaitScriptCompile &&
      !this._awaitSceneChanged
    ) {
      this._autoReloadTimmer && clearTimeout(this._autoReloadTimmer);

      this._autoReloadTimmer = setTimeout(() => {
        console.debug("auto refresh because script compiled or scene changed");

        this.reload();
      }, 500);
    }
  }
  reload() {
    reload();
  }
  async load(e) {
    if (!this._waitAutoLoadPromise) {
      this.currentScene = e?.scene || this.defaultScene;

      return e?.splashPreview
        ? this._load({ splashPreview: e.splashPreview })
        : ((e = e?.immediately || false),
          this.currentScene &&
          this.currentScene !== exports.CURRENT_SCENE &&
          !e &&
          this._awaitScriptCompile
            ? new Promise(async (e) => {
                this._waitAutoLoadPromise = e;
                const t = this._awaitScriptCompile
                  ? "waiting for script compile"
                  : `waiting for scene {asset(${this.currentScene})} loaded`;
                console.log(t + " ...");

                if (this._waitAutoLoadTimmer) {
                  clearTimeout(this._waitAutoLoadTimmer);
                }

                this._waitAutoLoadTimmer = setTimeout(() => {
                  this.step();
                  console.debug(t + " timeout");
                }, this._timeout);
              })
            : this._load());
    }
    console.log(Editor.I18n.t("preview.waitCurrentPreview"));
  }
  async _load(e) {
    var t = await Editor.Message.request("server", "query-port");
    var r = this.currentScene === this.defaultScene ? "" : this.currentScene;
    var e = e?.splashPreview ?? false;

    var t =
      this._protocol +
      "://localhost:" +
      t +
      (r ? "?scene=" + r : "") +
      (e ? `${r ? "&" : "?"}splashPreview=true` : "");

    Editor.Message.send("program", "open-url", t);

    if (this.currentScene === exports.CURRENT_SCENE) {
      this.currentSceneUuid = await Editor.Message.request(
        "scene",
        "query-current-scene"
      );
    }
  }
  async queryCurrentScene() {
    return (
      this.currentScene ||
      Editor.Profile.getConfig("preview", "general.start_scene")
    );
  }
  async queryPreviewUrl() {
    var e = await Editor.Message.request("server", "query-port");
    var t = await this.queryPreviewIp();
    return this._protocol + `://${t}:` + e;
  }
  async queryPreviewIp() {
    var e = await Editor.Profile.getConfig("preview", "preview_ip");
    var t = await Editor.Message.request("server", "query-sort-ip-list");
    return t.length < 1
      ? e
      : e
      ? !t.includes(e)
        ? (console.log(Editor.I18n.t("preview.ip.use_default"), t[0]), t[0])
        : e
      : t[0];
  }
  async setPreviewIp(e) {
    if (
      typeof e == "string" &&
      (await Editor.Message.request("server", "query-ip-list")).includes(e)
    ) {
      Editor.Message.broadcast("preview:ip-change", e);
      Editor.Profile.setConfig("preview", "preview_ip", e, "global");
    }
  }
  destroyed() {
    close();
    Editor.Profile.__protected__.removeListener("change", onProfileChange);
  }
}
function onProfileChange(e, t, r, i) {
  if (t === "packages/preview.json" && r === "general.auto_refresh") {
    exports.browserPreviewManager.canAutoRefresh = i;
  }

  if (t === "packages/preview.json" && r === "general.start_scene") {
    exports.browserPreviewManager.defaultScene = i;
  }
}
exports.browserPreviewManager = new PreviewManager();
