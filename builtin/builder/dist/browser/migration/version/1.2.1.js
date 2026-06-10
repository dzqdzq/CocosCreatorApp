Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateProfile_1_2_1 = migrateProfile_1_2_1;
exports.migratePackagesOption = migratePackagesOption;
exports.migrationOptions_1_2_1 = migrationOptions_1_2_1;
const lodash = require("lodash");
async function migrateProfile_1_2_1() {
  var e;
  var o = await Editor.Profile.getConfig("builder", "", "local");

  if (
    o &&
    ((e = o.BuildTaskManager && o.BuildTaskManager.queue), Array.isArray(e)) &&
    e.length !== 0
  ) {
    e.forEach((e) => {
      e = e.options;

      if (e[e.platform]) {
        console.warn(
          "The format of build options has changed, we has migrate your build options, but it still may cause some unexpected errors, please recompile or update your build options!"
        );

        lodash.set(e, "packages." + e.platform, e[e.platform]);
        delete e[e.platform];
      }
    });

    await Editor.Profile.setConfig("builder", "", o, "local");
  }
}
async function migratePackagesOption(o) {
  if (!o.packages && o.platform) {
    if (o[o.platform]) {
      console.warn(
        "The format of build options has changed, we has migrate your build options, but it still may cause some unexpected errors, please recompile or update your build options!"
      );

      lodash.set(o, "packages." + o.platform, o[o.platform]);
      delete o[o.platform];
    } else {
      var e = await Editor.Profile.getConfig(
        "builder",
        "" + o.platform,
        "default"
      );
      if (e) {
        console.warn(
          "The format of build options has changed, we has migrate your build options, but it still may cause some unexpected errors, please recompile or update your build options!"
        );
        for (const i of Object.keys(e)) {
          var a = e[i];
          Object.keys(a).forEach((e) => {
            if (e in o) {
              lodash.set(o, `packages.${i}.` + e, o[e]);
              delete o[e];
            }
          });
        }
      } else {
        console.warn(
          `Platform(${o.platform}) does not register default options! `
        );
      }
    }
  }
}
function migrationHuaweiOptions(e, o) {
  Object.keys(e).forEach((e) => {
    if (e in o) {
      lodash.set(o, "packages.huawei-mini-game." + e, o[e]);
      delete o[e];
    }
  });
}
async function migrationOptions_1_2_1(e, o, a) {
  if (a === "huawei-quick-game") {
    o = a = "huawei-mini-game";
  }

  var i = await Editor.Profile.getConfig(
    "builder",
    "BuildTaskManager.queue",
    "local"
  );
  if (Array.isArray(i)) {
    for (const t of i) {
      if (
        t.options.platform === "huawei-mini-game" &&
        a === "huawei-mini-game"
      ) {
        migrationHuaweiOptions(e, t.options);
      } else if (
        t.options.platform === a &&
        !lodash.get(t.options, "packages." + o)
      ) {
        await migratePackagesOption(t.options);
      }
    }
    await Editor.Profile.setConfig(
      "builder",
      "BuildTaskManager.queue",
      i,
      "local"
    );
  }
  const t = await Editor.Profile.getConfig("builder", "" + a, "local");
  if (t && !t[a]) {
    var r = {};
    r[o] = {};
    for (const s of Object.keys(e)) {
      if (t[s]) {
        r[o][s] = t[s];
      }
    }
    await Editor.Profile.setConfig("builder", "" + a, r, "local");
  }
  await Editor.Profile.setConfig("builder", "version." + a, "1.2.1", "local");
}
