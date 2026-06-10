Object.defineProperty(exports, "__esModule", { value: true });
exports.PhysicsMaterialImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
class PhysicsMaterialImporter extends asset_db_1.Importer {
  get version() {
    return "1.0.1";
  }
  get name() {
    return "physics-material";
  }
  get assetType() {
    return "cc.PhysicsMaterial";
  }
  async import(e) {
    await e.copyToLibrary(".json", e.source);
    return true;
  }
}
exports.PhysicsMaterialImporter = PhysicsMaterialImporter;
