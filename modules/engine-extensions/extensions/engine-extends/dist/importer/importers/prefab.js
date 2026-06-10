Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefabImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const index_1 = require("./scene/index");
const migrates_1 = require("./scene/migrates");
const fs_extra_1 = require("fs-extra");
const utils_1 = require("../utils");
class PrefabImporter extends asset_db_1.Importer {
  get version() {
    return index_1.version;
  }
  get name() {
    return "prefab";
  }
  get assetType() {
    return "cc.Prefab";
  }
  get migrations() {
    return migrates_1.migrations;
  }
  get migrationHook() {
    return {
      async pre(e) {
        e.getSwapSpace().json = await fs_extra_1.readJSON(e.source);
      },
      async post(e, r) {
        var s = e.getSwapSpace();

        if (r > 0) {
          r = JSON.stringify(s.json, null, 2);
          await fs_extra_1.writeFile(e.source, r);
        }

        delete s.json;
      },
    };
  }
  async import(e) {
    var r = await fs_extra_1.readJSON(e.source);
    var s = e.basename || "";

    var t =
      r[0].asyncLoadAssets !== !!e.userData.asyncLoadAssets ||
      r[0]._name !== s ||
      r[1]._name !== s ||
      r[0].persistent !== !!e.userData.persistent;

    var r =
      (t &&
        ((r[0]._name = s || ""),
        (r[0].asyncLoadAssets = !!e.userData.asyncLoadAssets),
        (r[1]._name = s || ""),
        (r[0].persistent = !!e.userData.persistent)),
      JSON.stringify(r, undefined, 2));

    if (t) {
      try {
        await fs_extra_1.writeFile(e.source, r);
      } catch (e) {}
    }
    await e.saveToLibrary(".json", r);
    t = utils_1.getDependUUIDList(r);
    e.setData("depends", t);
    e.userData.syncNodeName = s;
    return true;
  }
}
exports.PrefabImporter = PrefabImporter;
