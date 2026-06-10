Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateOptions = migrateOptions;
exports.migrateBuilderProfile = migrateBuilderProfile;
const _1_2_1_1 = require("./version/1.2.1");

const { compareVersion } = require("./utils");

const _1_2_2_1 = require("./version/1.2.2");
const _1_2_3_1 = require("./version/1.2.3");

const { migrateOptions: migrateOptions_2 } = require("./options");

async function migrateOptions(e, i) {
  await migrateOptions_2(e, i);
}
async function migrateBuilderProfile(r) {
  var e = await Editor.Profile.getConfig("builder", "", "local");
  if (e && Object.keys(e).length !== 0) {
    e.version = typeof e.version == "object" ? e.version : {};
    const t = e.version.builder;
    let i = Object.keys(migrateProfileMap).sort((e, i) =>
      compareVersion(e, i) ? 1 : -1
    );
    if (
      (i = (i = r ? i.filter((e) => !compareVersion(e, r)) : i).filter((e) =>
        compareVersion(e, t)
      )).length !== 0
    ) {
      for (const o of i) {
        await migrateProfileMap[o]();
        await Editor.Profile.setConfig("builder", "version.builder", o);
      }
      let e = await Editor.Profile.getConfig("builder", "version");
      e = e && typeof e == "object" ? e : {};
      e.builder = i[i.length - 1];
      await Editor.Profile.setConfig("builder", "version", e);
    }
  }
}

const migrateProfileMap = {
  "1.2.1": _1_2_1_1.migrateProfile_1_2_1,
  "1.2.2": _1_2_2_1.migrateProfile_1_2_2,
  "1.2.3": _1_2_3_1.migrateProfile_1_2_3,
};

const optionsMigrates = [
  _1_2_1_1.migratePackagesOption,
  _1_2_2_1.migrateTaskName,
  _1_2_2_1.migrateHuaweiOption,
];
