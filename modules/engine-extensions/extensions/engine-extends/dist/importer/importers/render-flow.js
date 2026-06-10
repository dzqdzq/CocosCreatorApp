Object.defineProperty(exports, "__esModule", { value: true });
exports.RenderFlowAssetImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const fs_extra_1 = require("fs-extra");
const utils_1 = require("../utils");
class RenderFlowAssetImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.0";
  }
  get name() {
    return "render-flow";
  }
  get assetType() {
    return "RenderFlow";
  }
  async import(e) {
    var r = await fs_extra_1.readFile(e.source, "utf8");
    var r = (await e.saveToLibrary(".json", r), utils_1.getDependUUIDList(r));
    e.setData("depends", r);
    return true;
  }
}
exports.RenderFlowAssetImporter = RenderFlowAssetImporter;
