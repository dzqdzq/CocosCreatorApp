async function migrateLocal(e) {
  if (e.builder?.options?.["vivo-mini-game"]?.wasmSubpackage !== undefined) {
    delete e.builder.options["vivo-mini-game"].wasmSubpackage;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
