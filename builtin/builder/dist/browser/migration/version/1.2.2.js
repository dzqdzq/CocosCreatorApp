Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateProfile_1_2_2 = migrateProfile_1_2_2;
exports.migrateHuaweiOption = migrateHuaweiOption;
exports.migrateTaskName = migrateTaskName;
exports.migrateHuaweiTemplate = migrateHuaweiTemplate;

const { join } = require("path");

const { existsSync, renameSync } = require("fs-extra");

async function migrateProfile_1_2_2() {
  var e = await Editor.Profile.getConfig("builder", "", "local");

  migrateHuaweiTemplate();

  if (e.common) {
    migrateTaskName(e.common);
  }

  if (e.common) {
    migrateHuaweiOption(e.common);
  }

  if (e.version && e.version["huawei-mini-game"]) {
    e.version["huawei-quick-game"] = e.version["huawei-mini-game"];
    delete e.version["huawei-mini-game"];
  }

  var a = e.BuildTaskManager && e.BuildTaskManager.queue;

  const i = {};

  if (Array.isArray(a) && a.length > 0) {
    a.forEach((e) => {
      var a = (i[new Date().getTime()] = e).options;
      migrateHuaweiOption(a);
      delete a.splashScreen;
      delete a.includeModules;
      delete a.designResolution;

      if (!a.outputName) {
        a.outputName = a.taskName || e.id;
        delete a.taskName;
      }
    });

    e.BuildTaskManager.taskMap = i;
    delete e.BuildTaskManager.queue;
  }

  if (e["huawei-mini-game"]) {
    e["huawei-quick-game"] = {
      "huawei-quick-game": e["huawei-mini-game"]["huawei-mini-game"],
    };

    delete e["huawei-mini-game"];
    await Editor.Profile.removeConfig("builder", "huawei-mini-game");
  }

  Editor.Profile.setConfig("builder", "", e, "local");
}
function migrateHuaweiOption(e) {
  if (
    e.platform === "huawei-mini-game" &&
    (e.platform === "huawei-mini-game" && (e.platform = "huawei-quick-game"),
    e.taskName === "huawei-mini-game" && (e.taskName = "huawei-quick-game"),
    e.packages) &&
    e.packages["huawei-mini-game"]
  ) {
    e.packages["huawei-quick-game"] = e.packages["huawei-mini-game"];
    delete e.packages["huawei-mini-game"];
  }
}
function migrateTaskName(e) {
  if (!e.outputName && e.taskName) {
    e.outputName = e.taskName;
    delete e.taskName;
  }

  if (e.outputName && e.taskName) {
    delete e.taskName;
  }
}
function migrateHuaweiTemplate() {
  var e = join(Editor.Project.path, "build-templates");
  var a = join(e, "huawei-mini-game");
  var e = join(e, "huawei-quick-game");

  if (existsSync(a)) {
    renameSync(a, e);
  }
}
