Object.defineProperty(exports, "__esModule", { value: true });
exports.RenderStageAssetImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const fs_extra_1 = require("fs-extra");
const utils_1 = require("../utils");
class RenderStageAssetImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.0";
  }
  get name() {
    return "render-stage";
  }
  get assetType() {
    return "RenderStage";
  }
  async import(e) {
    var t = await fs_extra_1.readFile(e.source, "utf8");
    var t = (await e.saveToLibrary(".json", t), utils_1.getDependUUIDList(t));
    e.setData("depends", t);
    return true;
  }
}
exports.RenderStageAssetImporter = RenderStageAssetImporter;
