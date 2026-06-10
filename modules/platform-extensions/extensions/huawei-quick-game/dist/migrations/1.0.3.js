async function migrateLocal(e) {
  if (e.builder?.options?.["huawei-quick-game"]?.wasmSubpackage !== undefined) {
    delete e.builder.options["huawei-quick-game"].wasmSubpackage;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
