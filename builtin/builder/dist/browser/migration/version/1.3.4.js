Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
exports.migrateProject = migrateProject;
exports.migrateGenMipmaps = migrateGenMipmaps;

const { existsSync, copy } = require("fs-extra");

const { isAbsolute, join, extname } = require("path");

const { compareVersion } = require("../utils");

async function migrateLocal(t) {
  if (t.BuildTaskManager && t.BuildTaskManager.taskMap) {
    for (const a of Object.keys(t.BuildTaskManager.taskMap)) {
      var e = t.BuildTaskManager.taskMap[a];
      if (e.options.packages) {
        for (const s of Object.keys(e.options.packages)) {
          await Editor.Profile.setConfig(
            s,
            "builder.taskOptionsMap." + e.id,
            e.options.packages[s],
            "local"
          );

          await Editor.Profile.setConfig(
            s,
            "builder.__version__",
            "1.3.4",
            "local"
          );
        }
        delete e.options.packages;
      }
    }
  }
}
async function migrateProject(t) {
  migrateGenMipmaps(t);
  await migrateSplashSetting(t);
}
async function migrateGenMipmaps(t) {
  var e = await Editor.Project.__protected__.getLastEditorVersion();

  if (e && compareVersion("3.7.0", e)) {
    if (
      !t.textureCompressConfig ||
      typeof t.textureCompressConfig.genMipmaps != "boolean"
    ) {
      t.textureCompressConfig || (t.textureCompressConfig = {});
      t.textureCompressConfig.genMipmaps = false;
    }
  }
}
async function migrateSplashSetting(t) {
  if (t["splash-setting"]) {
    var e = t["splash-setting"].url;
    if (e && isAbsolute(t["splash-setting"].url) && existsSync(e)) {
      if (e.includes("app.asar")) {
        return void delete t["splash-setting"].url;
      }
      var a = join(Editor.Project.path, "settings", "splash" + extname(e));
      await copy(e, a, { overwrite: true });

      t["splash-setting"].url = Editor.UI.__protected__.File.resolveToUrl(
        a,
        "project"
      );
    }
    delete t["splash-setting"].displayWatermark;
    t["splash-setting"].watermarkLocation = "default";

    if (t["splash-setting"].displayRatio) {
      t["splash-setting"].displayRatio = Editor.Utils.Math.clamp(
        t["splash-setting"].displayRatio,
        0.5,
        1.5
      );
    }
  }
}
