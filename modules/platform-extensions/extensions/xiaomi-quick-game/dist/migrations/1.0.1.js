async function migrateLocal(e) {
  if (
    e.options &&
    e.options["xiaomi-quick-game"] &&
    e.options["xiaomi-quick-game"].tinyPackageServer
  ) {
    e.common || (e.common = {});
    e.common.server = e.options["xiaomi-quick-game"].tinyPackageServer;
    delete e.options["xiaomi-quick-game"].tinyPackageServer;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
