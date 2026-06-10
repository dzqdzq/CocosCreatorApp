Object.defineProperty(exports, "__esModule", { value: true });
exports.version = undefined;
exports.SceneImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const migrates_1 = require("./migrates");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const utils_1 = require("../../utils");
class SceneImporter extends asset_db_1.Importer {
  get version() {
    return exports.version;
  }
  get name() {
    return "scene";
  }
  get assetType() {
    return "cc.SceneAsset";
  }
  get migrations() {
    return migrates_1.migrations;
  }
  get migrationHook() {
    return migrates_1.migrationHook;
  }
  async import(e) {
    var r = await fs_extra_1.readJSON(e.source);
    var s = r[0].asyncLoadAssets === !!e.userData.asyncLoadAssets;

    var s =
      (s && (r[0].asyncLoadAssets = !!e.userData.asyncLoadAssets),
      s &&
        ((s = JSON.stringify(r, undefined, 2)),
        await fs_extra_1.writeFile(e.source, s)),
      path_1.extname(e.source));

    var s =
      ((r[0]._name = path_1.basename(e.source, s)),
      JSON.stringify(r, undefined, 2));

    await e.saveToLibrary(".json", s);
    var r = utils_1.getDependUUIDList(s);
    e.setData("depends", r);
    return true;
  }
}
exports.SceneImporter = SceneImporter;
exports.version = "1.1.40";
