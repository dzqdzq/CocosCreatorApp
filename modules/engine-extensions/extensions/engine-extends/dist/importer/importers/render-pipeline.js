Object.defineProperty(exports, "__esModule", { value: true });
exports.RenderPipelineAssetImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
const fs_extra_1 = require("fs-extra");
const utils_1 = require("../utils");
class RenderPipelineAssetImporter extends asset_db_1.Importer {
  get version() {
    return "" + super.version;
  }
  get name() {
    return "render-pipeline";
  }
  get assetType() {
    return "cc.RenderPipeline";
  }
  async import(e) {
    var r = await fs_extra_1.readFile(e.source, "utf8");
    var r = (await e.saveToLibrary(".json", r), utils_1.getDependUUIDList(r));
    e.setData("depends", r);
    return true;
  }
}
exports.RenderPipelineAssetImporter = RenderPipelineAssetImporter;
