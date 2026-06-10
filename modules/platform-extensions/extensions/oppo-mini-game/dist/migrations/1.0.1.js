async function migrateLocal(o) {
  if (
    o.options &&
    o.options["oppo-mini-game"] &&
    o.options["oppo-mini-game"].tinyPackageServer
  ) {
    o.common || (o.common = {});
    o.common.server = o.options["oppo-mini-game"].tinyPackageServer;
    delete o.options["oppo-mini-game"].tinyPackageServer;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
