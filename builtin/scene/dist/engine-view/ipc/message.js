var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, s, r = s) => {
        var n = Object.getOwnPropertyDescriptor(t, s);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : t.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return t[s];
            },
          };
        }

        Object.defineProperty(e, r, n);
      }
    : (e, t, s, r) => {
        e[(r = r === undefined ? s : r)] = t[s];
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
    var n = (e) =>
      (n =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var s = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              s[s.length] = t;
            }
          }
          return s;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var s = n(e), r = 0; r < s.length; r++) {
          if (s[r] !== "default") {
            __createBinding(t, e, s[r]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineViewIPCMessages = undefined;
const basename = require("path").basename;
const float_window_1 = __importDefault(require("../plugin/float-window"));
const toolbar = __importStar(require("../plugin/toolbar"));

const { start, stop } = require("../listener");

const { join } = require("path");

const tasks_1 = __importDefault(require("../tasks"));
const index_1 = require("../particle/index");
const index_2 = require("../physics-2d/index");
const electronIpc = __importStar(require("@base/electron-base-ipc"));

const escToExitPointerLock = (e) => {
  if (e.code === "Escape") {
    document.exitPointerLock();
    document.removeEventListener("keydown", escToExitPointerLock);
  }
};

const messages = {
  async ready() {
    this.depend.execute("webview-ready");

    Editor.Profile.getConfig(
      "preview",
      "preview.current.platform",
      "local"
    ).then((e) => {
      this.previewCallMethod("setPlatform", e);
    });
  },
  close() {
    this.depend.reset("webview-ready");
  },
  "immediately-dump"(e) {
    tasks_1.default.updateDump(e);
  },
  "query-engine"() {
    return {
      path: this.info.path,
      utils: this.info.utils,
      compile: this.info.compile,
    };
  },
  async "query-scene"() {
    return (await Editor.Profile.getTemp("scene", "current-scene")) || "";
  },
  async "set-scene"(e) {
    await Editor.Profile.setTemp("scene", "current-scene", e || "");
  },
  async "clear-scene"() {
    Editor.Profile.setTemp("scene", "current-scene", "");
  },
  async "change-title"(e, t) {
    let s = "Untitled";

    if (
      e &&
      (r = await Editor.Message.request("asset-db", "query-asset-info", e))
    ) {
      s = basename(r.source || "");
    }

    if (t) {
      s += "*";
    }

    var r = (await Editor.Windows.__protected__.queryMainTitle()).split(" - ");
    r[0] = s;
    Editor.Windows.__protected__.changeMainTitle(r.join(" - "));
    this.onUpdateSceneDirty(e, t);
  },
  async "query-scripts"() {
    return await Editor.Message.request("asset-db", "query-assets", {
      ccType: "cc.Script",
    });
  },
  async "query-effects"() {
    return (
      await Editor.Message.request("asset-db", "query-assets", {
        importer: "effect",
        ccType: "cc.EffectAsset",
      })
    ).map((e) => e.uuid);
  },
  async "query-asset-info"(e) {
    return Editor.Message.request("asset-db", "query-asset-info", e);
  },
  async "query-asset-meta"(e) {
    return Editor.Message.request("asset-db", "query-asset-meta", e);
  },
  async "query-uuid"(e) {
    return Editor.Message.request("asset-db", "query-uuid", e);
  },
  async "query-assets"(e) {
    return Editor.Message.request("asset-db", "query-assets", e);
  },
  async "query-app-path"() {
    return Editor.App.path;
  },
  async "query-project-path"() {
    return Editor.Project.path;
  },
  async "get-config"(e, t, s) {
    return await Editor.Profile.getConfig(e, t, s);
  },
  async "set-config"(e, t, s, r) {
    return Editor.Profile.setConfig(e, t, s, r);
  },
  async "get-project"(e, t, s) {
    return Editor.Profile.getProject(e, t, s);
  },
  async "set-project"(e, t, s, r) {
    return Editor.Profile.setProject(e, t, s, r);
  },
  async "enter-mode"(e) {
    Editor.EditMode.enter(e);
  },
  async "get-packages"(e) {
    return Editor.Package.getPackages(e);
  },
  async selection(e, ...t) {
    return Editor.Selection[e](...t);
  },
  async "editor-dialog"(e, ...t) {
    return Editor.Dialog[e](...t);
  },
  async i18n(e, t) {
    return Editor.I18n.t(e, t);
  },
  async "get-contour-points"(e, t) {
    return index_2.physics2DMgr.getContourPoints(e, t);
  },
  async "export-particle-plist"(e, t) {
    return index_1.particleMgr.exportParticlePlist(e, t);
  },
  async panel(e, ...t) {
    return Editor.Panel[e](...t);
  },
  async broadcast(e, ...t) {
    await Editor.Message.broadcast(e, ...t);
  },
  async "init-preview-ipc"(s, e) {
    electronIpc.unregisterChannel(s);
    electronIpc.registerChannel(s);

    electronIpc.on(e, async (e, t) => {
      t = await this.callSceneMethod("queryPreviewData", [s, t]);
      e.reply(null, t);
    });
  },
  "scene:ready"() {
    start();
  },
  "scene:close"() {
    stop();
    float_window_1.default.unselect();
  },
  "select-nodes"(e) {
    const t = Editor.Selection.getSelected("node");
    e.forEach((e) => {
      if (!t.includes(e)) {
        Editor.Selection.select("node", e);
      }
    });
  },
  "unselect-nodes"(e) {
    e.forEach((e) => {
      Editor.Selection.unselect("node", e);
    });
  },
  "lock-pointer"(e) {
    if (e) {
      this.requestPointerLock();
      document.addEventListener("keydown", escToExitPointerLock);
    } else {
      document.exitPointerLock();
      document.removeEventListener("keydown", escToExitPointerLock);
    }
  },
  "change-pointer"(e) {
    document.body.style.cursor = e;
  },
  async "save-asset"(e, t) {
    return await Editor.Message.request("asset-db", "save-asset", e, t);
  },
  async "create-asset"(e, t, s) {
    var r = !!process.env.EDITOR_AUTO_TEST;
    if (!e && s) {
      var r = {
        scene: {
          url: `db://assets/${r ? "__test__/" : ""}scene.scene`,
          title: "scene.save",
          name: "Scene File",
          warn: "scene.messages.save_fail",
        },
        prefab: {
          url: `db://assets/${r ? "__test__/" : ""}node.prefab`,
          title: "scene.save_prefab",
          name: "Prefab File",
          warn: "scene.messages.save_fail_prefab",
        },
      };

      var n = await Editor.Message.request(
        "asset-db",
        "generate-available-url",
        r[s].url
      );

      var n = (await Editor.Message.request("asset-db", "query-path", n)) || "";

      var { canceled, filePath } = await Editor.Dialog.save({
        title: Editor.I18n.t(r[s].title),
        path: n,
        filters: [{ name: r[s].name, extensions: [s] }],
      });

      if (canceled) {
        return;
      }
      canceled = filePath || n;
      filePath = join(Editor.Project.path, "assets");
      if (
        !Editor.Utils.Path.contains(filePath, canceled) ||
        !canceled.endsWith("." + s)
      ) {
        return void (await Editor.Dialog.warn(Editor.I18n.t(r[s].warn), {
          title: Editor.I18n.t("scene.messages.warning"),
        }));
      }
      n = await Editor.Message.request("asset-db", "query-url", canceled);
      if (!n) {
        return;
      }
      e = n;
    }
    filePath = await Editor.Message.request("asset-db", "create-asset", e, t, {
      overwrite: true,
    });
    if (filePath) {
      Editor.Message.send("assets", "twinkle", filePath.uuid, "shrink");
      return filePath.uuid;
    }
  },
  async "save-asset-meta"(e, t) {
    return Editor.Message.request("asset-db", "save-asset-meta", e, t);
  },
  async "dirty-dialog"(e) {
    return (
      await Editor.Dialog.warn(
        (e || "Scene") + Editor.I18n.t("scene.messages.scenario_modified"),
        {
          title: Editor.I18n.t("scene.messages.warning"),
          detail: Editor.I18n.t("scene.messages.want_to_save"),
          default: 0,
          cancel: 2,
          buttons: [
            Editor.I18n.t("scene.messages.save"),
            Editor.I18n.t("scene.messages.dont_save"),
            Editor.I18n.t("scene.messages.cancel"),
          ],
        }
      )
    ).response;
  },
  "generate-available-url"(e) {
    return Editor.Message.request("asset-db", "generate-available-url", e);
  },
  async "record-scene-view"(e) {
    await Editor.Profile.setConfig("scene", "scene_view", e);
  },
  async "record-gizmos"(e) {
    var t;

    if (e.gizmosInfos) {
      t = (await Editor.Profile.getConfig("scene", "gizmos-infos")) || {};
      Object.assign(t, e.gizmosInfos);
      await Editor.Profile.setConfig("scene", "gizmos-infos", t);
    }

    if (e.snapConfigs) {
      t = (await Editor.Profile.getConfig("scene", "snap-configs")) || {};
      Object.assign(t, e.snapConfigs);
      await Editor.Profile.setConfig("scene", "snap-configs", t);
    }

    if (e.rectSnapConfigs) {
      t = (await Editor.Profile.getConfig("scene", "rect-snap-configs")) || {};

      Object.assign(t, e.rectSnapConfigs);
      await Editor.Profile.setConfig("scene", "rect-snap-configs", t);
    }
  },
  "update-plugin"(e) {
    this.updatePlugin(e);
  },
  "send-plugin"(e, ...t) {
    if (e === "float-window") {
      float_window_1.default.send(...t);
    }
  },
  "force-update"(e, t) {
    const s = {};
    const r = [];

    t.nodes.forEach((e) => {
      e.components.forEach((e) => {
        if (!r.includes(e.type)) {
          r.push(e.type);
          (s[e.type] = s[e.type] || []).push(e);
        }
      });
    });

    switch (e) {
      case "toolbar": {
        toolbar.update(t, r, s);
        break;
      }
      case "float-window": {
        float_window_1.default.update(t, r, s);
      }
    }
  },
  "multi-open-scene"(e, t) {
    console.debug("multi-open-scene", e, t);
    this.onUpdateScene(e);
  },
  "multi-close-scene"(e, t) {
    console.debug("multi-close-scene", e, t);
    this.onCloseScene(e);
  },
  "multi-scene-dirty"(e, t) {
    console.debug("multi-scene-dirty", e, t);
    this.onUpdateSceneDirty(e, !!t);
  },
  "multi-scene-focus"(e) {
    console.debug("multi-scene-focus", e);
    this.onSceneFocus(e);
  },
};

exports.EngineViewIPCMessages = messages;
