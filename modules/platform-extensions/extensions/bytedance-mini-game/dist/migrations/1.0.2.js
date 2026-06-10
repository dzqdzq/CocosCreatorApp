async function migrateLocal(e) {
  if (
    e.options &&
    e.options["bytedance-mini-game"] &&
    e.options["bytedance-mini-game"].remoteServerAddress
  ) {
    e.common || (e.common = {});
    e.common.server = e.options["bytedance-mini-game"].remoteServerAddress;
    delete e.options["bytedance-mini-game"].remoteServerAddress;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
