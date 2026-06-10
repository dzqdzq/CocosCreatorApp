async function migrateLocal(o) {
  if (o.options && o.options.qtt && o.options.qtt.resourceURL) {
    o.common || (o.common = {});
    o.common.server = o.options.qtt.resourceURL;
    delete o.options.qtt.resourceURL;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = undefined;
exports.migrateLocal = migrateLocal;
