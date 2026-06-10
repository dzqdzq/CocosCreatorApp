Object.defineProperty(exports, "__esModule", { value: true });
exports.UnknownImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const cc_1 = require("cc");
const utils_1 = require("../utils");
class UnknownImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.0";
  }
  get name() {
    return "*";
  }
  get assetType() {
    return "cc.Asset";
  }
  async validate(e) {
    return !e.isDirectory();
  }
  async import(e) {
    var t;

    if (e instanceof asset_db_1.Asset) {
      await e.copyToLibrary(e.extname, e.source);
      t = new cc_1.Asset();
      t.name = e.basename;
      t._setRawAsset(e.extname);
      t = EditorExtends.serialize(t);
      await e.saveToLibrary(".json", t);
      t = utils_1.getDependUUIDList(t);
      e.setData("depends", t);
    }

    return true;
  }
}
exports.UnknownImporter = UnknownImporter;
