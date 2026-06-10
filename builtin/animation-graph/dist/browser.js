Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.load = load;
exports.unload = unload;
const Profile = require("@base/electron-profile");
let hasOnProfileChange = false;
function load() {}
function unload() {}
exports.methods = {
  async open(e) {
    if (e) {
      await Editor.Message.request("scene", "execute-scene-script", {
        name: "animation-graph",
        method: "edit",
        args: [e],
      });
    }

    if (
      (await Editor.Panel.has("scene")) &&
      !(await Editor.Task.__protected__.hasSyncTask())
    ) {
      Editor.Panel.openBeside("scene", "animation-graph");
    } else {
      Editor.Panel.open("animation-graph");
    }
  },
  async dialogWarn() {
    return (
      await Editor.Dialog.warn(
        Editor.I18n.t("animation-graph.warningCaption"),
        {
          title: Editor.I18n.t("animation-graph.warning"),
          detail: Editor.I18n.t("animation-graph.warningDetail"),
          default: 0,
          cancel: 2,
          buttons: [
            Editor.I18n.t("animation-graph.save"),
            Editor.I18n.t("animation-graph.abort"),
            Editor.I18n.t("animation-graph.cancel"),
          ],
        }
      )
    ).response;
  },
  async profileBindWatchWhenSceneReady() {
    if (!hasOnProfileChange) {
      const r = Profile.load("global://packages/animation-graph.json");
      const s = "animation-graph.pose-expr";

      Profile.on("change", async (e, a, n, o) => {
        var i;
        var t;

        if (
          ["global", "project"].includes(e) &&
          ["packages/animation-graph.json", "packages/engine.json"].includes(a)
        ) {
          i = (t = await Editor.Profile.getProject("engine", "modules"))
            .globalConfigKey;

          t = t.configs[i].cache;

          e !== "global" ||
            a !== "packages/animation-graph.json" ||
            n !== s ||
            o !== true ||
            (await exports.methods.profileCheckConfigIsLegal(t, r.get(s))) ||
            (0 ===
              (await exports.methods.profileDialogWarn(
                Editor.I18n.t("animation-graph.configEngineWarn")
              )) &&
              (await exports.methods.profileEnsureEngineIsLegal(),
              Editor.Message.broadcast("project:engine-modules-changed")));

          e !== "project" ||
            a !== "packages/engine.json" ||
            (n !== "modules.configs." + i && n !== "modules.globalConfigKey") ||
            (await exports.methods.profileCheckConfigIsLegal(t, r.get(s))) ||
            (0 ===
              (await exports.methods.profileDialogWarn(
                Editor.I18n.t("animation-graph.configPreferencesWarn")
              )) &&
              (await exports.methods.profileEnsureEngineIsLegal(),
              r.set(s, true),
              r.save(),
              Editor.Message.broadcast("preferences:packages-changed")));
        }
      });

      hasOnProfileChange = true;
    }
  },
  async profileCheckConfigIsLegal(e, a) {
    return !(
      (a && e["procedural-animation"]._value === false) ||
      (a && e.marionette._value === false) ||
      (!a && e["procedural-animation"]._value === true)
    );
  },
  async profileEnsureEngineIsLegal() {
    var cache = await Editor.Profile.getProject("engine", "modules");
    var a_globalConfigKey = cache.globalConfigKey;
    var { cache, includeModules } = a.configs[a_globalConfigKey];
    if (cache && Array.isArray(includeModules)) {
      let e = false;

      if (!includeModules.includes("marionette")) {
        includeModules.push("marionette");
        e = true;
      }

      if (!includeModules.includes("procedural-animation")) {
        includeModules.push("procedural-animation");
        e = true;
      }

      if (!cache.marionette._value) {
        cache.marionette._value = true;
        e = true;
      }

      if (!cache["procedural-animation"]._value) {
        cache["procedural-animation"]._value = true;
        e = true;
      }

      if (e) {
        await Editor.Profile.setProject(
          "engine",
          `modules.configs.${a_globalConfigKey}.cache`,
          cache
        );

        await Editor.Profile.setProject(
          "engine",
          `modules.configs.${a_globalConfigKey}.includeModules`,
          includeModules.sort()
        );

        Editor.Message.broadcast(
          "engine:engine-modules-global-config-changed",
          includeModules.sort()
        );

        Editor.Message.broadcast("project:engine-modules-changed");
      }

      return true;
    }
  },
  async profileDialogWarn(e) {
    return (
      await Editor.Dialog.warn(
        Editor.I18n.t("animation-graph.configInvalidTitle"),
        {
          title: Editor.I18n.t("animation-graph.warning"),
          detail: e,
          default: 0,
          cancel: 1,
          buttons: [
            Editor.I18n.t("animation-graph.ok"),
            Editor.I18n.t("animation-graph.cancel"),
          ],
        }
      )
    ).response;
  },
};
