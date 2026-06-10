async function migrateLocal(e) {
  if (
    e.options &&
    e.options["huawei-quick-game"] &&
    e.options["huawei-quick-game"].tinyPackageServer
  ) {
    e.common || (e.common = {});
    e.common.server = e.options["huawei-quick-game"].tinyPackageServer;
    delete e.options["huawei-quick-game"].tinyPackageServer;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
