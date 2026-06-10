async function migrateLocal(e) {
  if (
    e.options &&
    e.options["baidu-mini-game"] &&
    e.options["baidu-mini-game"].remoteServerAddress
  ) {
    e.common || (e.common = {});
    e.common.server = e.options["baidu-mini-game"].remoteServerAddress;
    delete e.options["baidu-mini-game"].remoteServerAddress;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = undefined;
exports.migrateLocal = migrateLocal;
