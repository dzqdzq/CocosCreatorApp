Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.load = load;
exports.unload = unload;

const { join, dirname } = require("path");

const { existsSync, readJSONSync, outputFileSync } = require("fs-extra");

const plugin_1 = require("./plugin");
async function load() {
  await plugin_1.pluginManager.init();
}
function unload() {
  plugin_1.pluginManager.destroy();
}
exports.methods = {
  async openSettings(e, ...r) {
    if (await Editor.Panel.has("preferences.settings")) {
      Editor.Message.send("preferences", "change-settings-tab", e, ...r);
      Editor.Panel.open("preferences.settings");
    } else if (
      (await Editor.Panel.has("scene")) &&
      !(await Editor.Task.__protected__.hasSyncTask())
    ) {
      Editor.Panel.openBeside("scene", "preferences.settings", e, ...r);
    } else {
      Editor.Panel.open("preferences.settings", e, ...r);
    }
  },
  async queryConfig(e, r, t) {
    return plugin_1.pluginManager.hasRegisterPackages.has(e)
      ? Editor.Profile.getConfig(e, r, t)
      : null;
  },
  async setConfig(e, r, t, n) {
    return (
      !!plugin_1.pluginManager.hasRegisterPackages.has(e) &&
      (await Editor.Profile.setConfig(e, r, t, n), true)
    );
  },
  async queryConfigsFromPath(e, r = 0) {
    try {
      var t;
      if (existsSync(Editor.UI.__protected__.File.resolveToRaw(e))) {
        t = readJSONSync(e);
        return await plugin_1.pluginManager.handleQueryConfigs(t);
      }
      throw new Error("The file path to query config does not exist!");
    } catch (e) {
      console.error("Query preferences config failed! ", e);
    }
  },
  async importConfig(e) {
    if (!e) {
      var r = await Editor.Dialog.select({
        title: Editor.I18n.t("preferences.menu.importConfig"),
        type: "file",
        multi: false,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!r.filePaths || !r.filePaths[0]) {
        return;
      }
      e = r.filePaths[0];
    }
    try {
      if (!existsSync(Editor.UI.__protected__.File.resolveToRaw(e))) {
        throw new Error("The file path to import config does not exist!");
      }
      var t = readJSONSync(e);

      await plugin_1.pluginManager.handleImportConfigs(t);
      console.log("Import preferences config success!");
      var n = await Editor.Message.request("preferences", "query-settings-tab");

      if (n) {
        Editor.Message.send("preferences", "refresh-settings-tab", n);
      }
    } catch (e) {
      console.error("Import preferences config failed! ", e);
    }
  },
  async exportConfig(e) {
    var r = await plugin_1.pluginManager.handleExportConfigs();
    if (!e) {
      var t = await Editor.Dialog.save({
        title: Editor.I18n.t("preferences.menu.exportConfig"),
        path: join(Editor.Project.path, "preferences-configs.json"),
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!t.filePath) {
        return;
      }
      e = t.filePath;
    }
    try {
      if (!existsSync(Editor.UI.__protected__.File.resolveToRaw(dirname(e)))) {
        throw new Error("The file path to export config does not exist!");
      }
      outputFileSync(e, JSON.stringify(r, null, 2));
      console.log(`Preferences config has exported in {link[${e}](${e})}`);
    } catch (e) {
      console.error("Export preferences config failed!", e);
    }
  },
  queryPreferencesConfigs() {
    return plugin_1.pluginManager.configs;
  },
};
