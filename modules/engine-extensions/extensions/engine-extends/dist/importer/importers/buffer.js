Object.defineProperty(exports, "__esModule", { value: true });
exports.BufferImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const path_1 = require("path");
const utils_1 = require("../utils");
class BufferImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.3";
  }
  get name() {
    return "buffer";
  }
  get assetType() {
    return "cc.BufferAsset";
  }
  async import(e) {
    var r = path_1.extname(e.source);
    await e.copyToLibrary(r, e.source);
    try {
      var t = new cc.BufferAsset();

      t.name = e.basename || "";
      t._setRawAsset(".bin");
      var s = EditorExtends.serialize(t);
      await e.saveToLibrary(".json", s);
      var a = utils_1.getDependUUIDList(s);
      e.setData("depends", a);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}
exports.BufferImporter = BufferImporter;
