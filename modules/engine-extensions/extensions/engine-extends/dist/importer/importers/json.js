Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const fs_extra_1 = require("fs-extra");
const utils_1 = require("../utils");
class JsonImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.0";
  }
  get name() {
    return "json";
  }
  get assetType() {
    return "cc.JsonAsset";
  }
  async import(e) {
    var s = await fs_extra_1.readJSON(e.source);
    var r = new cc.JsonAsset();
    var s = ((r.name = e.basename), (r.json = s), EditorExtends.serialize(r));
    await e.saveToLibrary(".json", s);
    var r = utils_1.getDependUUIDList(s);
    e.setData("depends", r);
    return true;
  }
}
exports.JsonImporter = JsonImporter;
