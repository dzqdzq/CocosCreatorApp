Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.load = load;
exports.unload = unload;
const electron_1 = require("electron");

const { existsSync, copy } = require("fs-extra");

const { join } = require("path");

const {
  createProgrammingFacet,
  getPreviewFacet,
} = require("../programming/FacetInstance");

const { runSimulator, writeSettingFile } = require("./simulator");

const { buildSimulatorEngineTS } = require("./build-simulator-engine-ts");

const plugin_1 = require("./plugin");
const preview_manager_1 = require("./preview-manager");

const { queryConnectNum } = require("../contributions/server");

const preview_settings_1 = require("./preview-settings");
let pkg = null;
let currMode = "browser";
let firstMetrics = false;
async function load() {
  pkg = this;

  if (Editor.Startup.__protected__.ready.package) {
    await plugin_1.pluginManager.init();
  } else {
    Editor.Startup.__protected__.once("package-ready", async () => {
      await plugin_1.pluginManager.init();
    });
  }

  await preview_manager_1.browserPreviewManager.init();

  createProgrammingFacet().catch((e) => {
    console.error(e);
  });
}
function unload() {
  preview_manager_1.browserPreviewManager.destroyed();
}
exports.methods = {
  async ready() {
    if (firstMetrics) {
      firstMetrics = false;
      Editor.Metrics.trackTimeEnd("preview:ready-browser");
    }
  },
  open() {
    Editor.Panel.open("preview.panel");
  },
  async generateSettings(e) {
    return preview_settings_1.previewSettingsManager.querySettingsData(
      e.type,
      e
    );
  },
  async buildSimulatorEngineTS() {
    return new Promise((e, r) => {
      Editor.Metrics.trackTimeStart("programming:compile-native-engine-start");
      Editor.Message.broadcast("programming:compile-start", "nativeEngine");

      buildSimulatorEngineTS()
        .then(() => {
          Editor.Message.broadcast("programming:compiled", "nativeEngine");

          Editor.Metrics.trackTimeEnd(
            "programming:compile-native-engine-start"
          );

          e(true);
        })
        .catch((e) => {
          r(e);
        });
    });
  },
  previewSceneInBrowser(e) {
    if (e) {
      preview_manager_1.browserPreviewManager.load({ scene: e });
    }
  },
  async "open-terminal"(e) {
    var { openMode: e, splashPreview } = e || {};
    if (e && e === "browser" && splashPreview) {
      await preview_manager_1.browserPreviewManager.load({
        splashPreview: true,
      });
    } else {
      switch (currMode) {
        case "browser": {
          firstMetrics = true;
          Editor.Metrics.trackTimeStart("preview:ready-browser");
          await preview_manager_1.browserPreviewManager.load();
          break;
        }
        case "simulator": {
          Editor.Metrics.trackTimeStart("preview:ready-simulator");

          await runSimulator(() => {
            Editor.Metrics.trackTimeEnd("preview:ready-simulator");
          });
        }
      }
    }
  },
  async "restart-simulator"() {
    await runSimulator();
  },
  async "pause-terminal"(e) {
    await Editor.Message.request(
      "scene",
      "editor-preview-call-method",
      "pause",
      e
    );
  },
  async "step-terminal"() {
    Editor.Message.request("scene", "editor-preview-call-method", "step");
  },
  async "on-pack-build-end"(e) {
    if (e === "preview") {
      await getPreviewFacet()?.notifyPackDriverUpdated();
    }
  },
  "change-platform"(e) {
    currMode = e;

    Editor.Message.request(
      "scene",
      "editor-preview-call-method",
      "setPlatform",
      e
    );
  },
  "reload-terminal"() {
    preview_manager_1.browserPreviewManager.reload();
  },
  async queryPreviewUrl() {
    return preview_manager_1.browserPreviewManager.queryPreviewUrl();
  },
  queryConnectNum() {
    return queryConnectNum();
  },
  async "get-preview-ip"() {
    return preview_manager_1.browserPreviewManager.queryPreviewIp();
  },
  "set-preview-ip"(e) {
    preview_manager_1.browserPreviewManager.setPreviewIp(e);
  },
  async "create-template"(e) {
    var r = join(__dirname, "./../../static/views/index.ejs").replace(
      "app.asar",
      "app.asar.unpacked"
    );

    var a = join(Editor.Project.path, "preview-template", "index.ejs");

    if (
      existsSync(a) &&
      !e &&
      (
        await Editor.Dialog.warn(
          Editor.I18n.t("preview.dialog.create_template_message"),
          {
            buttons: [
              Editor.I18n.t("preview.dialog.confirm"),
              Editor.I18n.t("preview.dialog.cancel"),
            ],
            default: 0,
            cancel: 1,
          }
        )
      ).response === 1
    ) {
      return false;
    }
    await copy(r, a, { overwrite: true });
    console.log(Editor.I18n.t("preview.creat_template_success") + `( ${a} )`);
    electron_1.shell.showItemInFolder(a);
    return true;
  },
  async writeSettingFile(e) {
    return writeSettingFile(e);
  },
  async "asset-db:asset-change"(e) {
    if (e === preview_manager_1.browserPreviewManager.currentSceneUuid) {
      preview_manager_1.browserPreviewManager.sceneChanged = true;
    }
  },
  async currentSceneSave(e) {
    if (
      preview_manager_1.browserPreviewManager.currentScene ===
        preview_manager_1.CURRENT_SCENE ||
      preview_manager_1.browserPreviewManager.currentSceneUuid ===
        preview_manager_1.CURRENT_SCENE
    ) {
      preview_manager_1.browserPreviewManager.sceneChanged = true;
      preview_manager_1.browserPreviewManager.currentSceneUuid = e;
    }
  },
  async "programming:compiled"() {
    preview_manager_1.browserPreviewManager.scriptCompiled = true;
  },
  async "programming:compile-start"() {
    preview_manager_1.browserPreviewManager.scriptCompiled = false;
  },
  "query-preview-scene"() {
    return preview_manager_1.browserPreviewManager.queryCurrentScene();
  },
  "build-worker:ready"() {
    preview_settings_1.previewSettingsManager.start();
  },
  "build-worker:closed"() {
    preview_settings_1.previewSettingsManager.close();
  },
};
