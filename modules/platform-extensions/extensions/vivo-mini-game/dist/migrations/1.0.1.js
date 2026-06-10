async function migrateLocal(e) {
  if (
    e.options &&
    e.options["vivo-mini-game"] &&
    e.options["vivo-mini-game"].tinyPackageServer
  ) {
    e.common || (e.common = {});
    e.common.server = e.options["vivo-mini-game"].tinyPackageServer;
    delete e.options["vivo-mini-game"].tinyPackageServer;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
