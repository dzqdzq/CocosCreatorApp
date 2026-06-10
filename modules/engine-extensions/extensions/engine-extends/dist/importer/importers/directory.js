Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectoryImporter = undefined;
const asset_db_1 = require("@editor/asset-db");
class DirectoryImporter extends asset_db_1.Importer {
  get version() {
    return "1.1.0";
  }
  get name() {
    return "directory";
  }
  get assetType() {
    return "cc.Asset";
  }
  async validate(e) {
    return e.isDirectory();
  }
  get migrations() {
    return [{ version: "1.1.0", migrate: migrateSubpackageSettings }];
  }
  async import(e) {
    if (asset_db_1.queryUrl(e.uuid) === "db://assets/resources") {
      e.userData.isBundle = true;
      e.userData.bundleName = "resources";
      e.userData.priority = 8;
    }

    e.userData.compressionType = e.userData.compressionType || {};
    e.userData.isRemoteBundle = e.userData.isRemoteBundle || {};
    return true;
  }
}
function migrateSubpackageSettings(e) {
  e.userData.isBundle = false;
  e.userData.priority = 1;
  e.userData.bundleName = "";
  e.userData.compressionType = {};
  e.userData.isRemoteBundle = {};

  if (e.userData.isSubpackage) {
    e.userData.isBundle = e.userData.isSubpackage;
    e.userData.bundleName = e.userData.subpackageName || "";
    e.userData.priority = 5;
  }

  e.userData.isSubpackage = undefined;
  e.userData.subpackageName = undefined;
}
exports.DirectoryImporter = DirectoryImporter;
