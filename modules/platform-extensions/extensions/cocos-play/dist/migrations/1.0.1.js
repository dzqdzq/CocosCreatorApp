async function migrateLocal(o) {
  if (
    o.options &&
    o.options["cocos-play"] &&
    o.options["cocos-play"].resourceURL
  ) {
    o.common || (o.common = {});
    o.common.server = o.options["cocos-play"].resourceURL;
    delete o.options["cocos-play"].resourceURL;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = undefined;
exports.migrateLocal = migrateLocal;
