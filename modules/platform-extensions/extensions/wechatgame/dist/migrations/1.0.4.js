async function migrateLocal(e) {
  if (e.builder && e.builder.common) {
    e.builder.common.useSplashScreen = true;
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
