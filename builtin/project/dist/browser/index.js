Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.load = load;
exports.unload = unload;

const {
  existsSync,
  readJSONSync,
  outputFileSync,
  readJSON,
  outputJSONSync,
} = require("fs-extra");

const { join, dirname } = require("path");

const plugin_1 = require("./plugin");
const layout_counter_1 = require("../contributions/joint/layout-counter");
async function load() {
  await plugin_1.pluginManager.init();
}
function unload() {
  plugin_1.pluginManager.destroy();
}

(() => {
  var e = join(
    Editor.Project.path,
    "./settings",
    Editor.App.version,
    "./packages/project-setting.json"
  );
  if (existsSync(e)) {
    try {
      var t = require(e);
      Editor.Profile.setProject("project", "", t);
    } catch (e) {
      console.log(e);
    }
  }
})();

exports.methods = {
  async openSettings(e, t, ...r) {
    if (await Editor.Panel.has("project.settings")) {
      Editor.Message.send("project", "change-settings-tab", e, t, ...r);
      Editor.Panel.open("project.settings");
    } else if (
      (await Editor.Panel.has("scene")) &&
      !(await Editor.Task.__protected__.hasSyncTask())
    ) {
      Editor.Panel.openBeside("scene", "project.settings", e, t, ...r);
    } else {
      Editor.Panel.open("project.settings", e, t, ...r);
    }
  },
  openJoint() {
    console.warn(
      '`Editor.Message.send("project", "open-joint")` is deprecated, Please use `Editor.Message.send("project", "open-settings", "project", "joint")`'
    );

    exports.methods.openSettings("project", "joint");
  },
  calcJointLayouts: layout_counter_1.calcJointLayouts,
  changeScriptConfig() {
    Editor.Task.addNotice({
      title: "Project Script",
      message: Editor.I18n.t("project.scripts.config_changed_info"),
    });

    Editor.Message.broadcast("project:script-config-changed");
  },
  async changeDesignResolution(e, t) {
    var r = await Editor.Profile.getProject(
      "project",
      "general.designResolution"
    );
    Editor.Message.broadcast("project:change-design-resolution", r);
  },
  async queryDesignResolution() {
    return Editor.Profile.getProject("project", "general.designResolution");
  },
  async changeCustomLayer() {
    var e = await Editor.Profile.getProject("project", "layer");
    Editor.Message.broadcast("project:change-custom-layer", e);
  },
  async changeSortingLayer() {
    var e = (await Editor.Profile.getProject("project", "sorting-layer")) || {};
    Editor.Message.broadcast("project:change-sorting-layer", e.layers);
  },
  queryProjectConfigs() {
    return plugin_1.pluginManager.configs;
  },
  async queryConfig(e, t, r) {
    return plugin_1.pluginManager.hasRegisterPackages.has(e)
      ? Editor.Profile.getProject(e, t, r)
      : null;
  },
  async setConfig(e, t, r) {
    return (
      !!plugin_1.pluginManager.hasRegisterPackages.has(e) &&
      (await Editor.Profile.setProject(e, t, r, "project"), true)
    );
  },
  async queryConfigsFromPath(e) {
    try {
      var t;
      if (existsSync(Editor.UI.__protected__.File.resolveToRaw(e))) {
        t = readJSONSync(e);
        return await plugin_1.pluginManager.handleQueryConfigs(t);
      }
      throw new Error("The file path to query config does not exist!");
    } catch (e) {
      console.error("Query project config failed! ", e);
    }
  },
  async importConfig(e) {
    if (!e) {
      var t = await Editor.Dialog.select({
        title: Editor.I18n.t("project.menu.importConfig"),
        type: "file",
        multi: false,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!t.filePaths || !t.filePaths[0]) {
        return;
      }
      e = t.filePaths[0];
    }
    try {
      if (!existsSync(Editor.UI.__protected__.File.resolveToRaw(e))) {
        throw new Error("The file path to import config does not exist!");
      }
      var r = readJSONSync(e);

      await plugin_1.pluginManager.handleImportConfigs(r);
      console.log("Import project config success!");
      var i = await Editor.Message.request("project", "query-settings-tab");

      if (i) {
        Editor.Message.send("project", "refresh-settings-tab", i.tab, i.subTab);
      }
    } catch (e) {
      console.error("Import project config failed! ", e);
    }
  },
  async exportConfig(e) {
    var t = await plugin_1.pluginManager.handleExportConfigs();
    if (!e) {
      var r = await Editor.Dialog.save({
        title: Editor.I18n.t("project.menu.exportConfig"),
        path: join(Editor.Project.path, "project-configs.json"),
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!r.filePath) {
        return;
      }
      e = r.filePath;
    }
    try {
      if (!existsSync(Editor.UI.__protected__.File.resolveToRaw(dirname(e)))) {
        throw new Error("The file path to export config does not exist!");
      }
      outputFileSync(e, JSON.stringify(t, null, 2));
      console.log(`project config has export in {link[${e}](${e})}`);
    } catch (e) {
      console.error("Export project config failed!", e);
    }
  },
  async changeHighQuality() {
    var e = await Editor.Profile.getProject("project", "high-quality");

    Editor.Message.broadcast("project:change-high-quality", e);
    var t = join(Editor.Project.path, "./.creator/default-meta.json");

    let r = {};

    if (existsSync(t)) {
      r = await readJSON(t);
    }

    if (e) {
      r.texture || (r.texture = {});
      r["erp-texture-cube"] || (r["erp-texture-cube"] = {});

      (r.texture.minfilter === "linear" &&
        r.texture.magfilter === "linear" &&
        r.texture.mipfilter === "nearest" &&
        r["erp-texture-cube"].minfilter === "linear" &&
        r["erp-texture-cube"].magfilter === "linear" &&
        r["erp-texture-cube"].mipfilter === "nearest") ||
        console.warn(`The default meta data of texture has been modified.
PORJECT://.creator/default-meta.json`);

      r.texture.minfilter = "linear";
      r.texture.magfilter = "linear";
      r.texture.mipfilter = "nearest";
      r["erp-texture-cube"].minfilter = "linear";
      r["erp-texture-cube"].magfilter = "linear";
      r["erp-texture-cube"].mipfilter = "nearest";
    } else {
      ((r.texture &&
        (r.texture.minfilter || r.texture.magfilter || r.texture.mipfilter)) ||
        (r["erp-texture-cube"] &&
          (r["erp-texture-cube"].minfilter ||
            r["erp-texture-cube"].magfilter ||
            r["erp-texture-cube"].mipfilter))) &&
        console.warn(`The default meta data of texture has been modified.
  PORJECT://.creator/default-meta.json`);

      r.texture &&
        (delete r.texture.minfilter,
        delete r.texture.magfilter,
        delete r.texture.mipfilter);

      r["erp-texture-cube"] &&
        (delete r["erp-texture-cube"].minfilter,
        delete r["erp-texture-cube"].magfilter,
        delete r["erp-texture-cube"].mipfilter);
    }

    outputJSONSync(t, r, { spaces: 2 });
    Editor.Message.send("asset-db", "refresh-default-user-data-config");
  },
};
