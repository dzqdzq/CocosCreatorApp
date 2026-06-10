Object.defineProperty(exports, "__esModule", { value: true });
exports.TextImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const utils_1 = require("../utils");
class TextImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.1";
  }
  get name() {
    return "text";
  }
  get assetType() {
    return "cc.TextAsset";
  }
  async validate(e) {
    return (
      !(await e.isDirectory()) &&
      (e.extname !== ".ts" || path_1.extname(e.basename) === ".d")
    );
  }
  async import(e) {
    var t = await fs_extra_1.readFile(e.source, "utf8");
    var r = new cc.TextAsset();
    var t = ((r.name = e.basename), (r.text = t), EditorExtends.serialize(r));
    await e.saveToLibrary(".json", t);
    var r = utils_1.getDependUUIDList(t);
    e.setData("depends", r);
    return true;
  }
}
exports.TextImporter = TextImporter;
