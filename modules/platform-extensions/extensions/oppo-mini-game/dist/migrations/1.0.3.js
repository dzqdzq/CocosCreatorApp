async function migrateLocal(e) {
  if (e.builder?.options?.["oppo-mini-game"]?.wasmSubpackage !== undefined) {
    delete e.builder.options["oppo-mini-game"].wasmSubpackage;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
