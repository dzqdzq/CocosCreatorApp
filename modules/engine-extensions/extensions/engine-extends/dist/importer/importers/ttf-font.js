Object.defineProperty(exports, "__esModule", { value: true });
exports.TTFFontImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const utils_1 = require("../utils");
class TTFFontImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.1";
  }
  get name() {
    return "ttf-font";
  }
  get assetType() {
    return "cc.TTFFont";
  }
  get assetExtends() {
    return ["cc.Font"];
  }
  async import(e) {
    var t = e.basename + ".ttf";
    var t = (await e.copyToLibrary(t, e.source), this.createTTFFont(e));
    var t = EditorExtends.serialize(t);
    var t = (await e.saveToLibrary(".json", t), utils_1.getDependUUIDList(t));
    e.setData("depends", t);
    return true;
  }
  createTTFFont(e) {
    var t = new cc.TTFFont();
    t.name = e.basename;
    t._setRawAsset(t.name + ".ttf");
    return t;
  }
}
exports.TTFFontImporter = TTFFontImporter;
