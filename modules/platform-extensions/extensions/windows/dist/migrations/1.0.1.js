async function migrateLocal(o) {
  if (
    o.options &&
    o.options.windows &&
    o.options.windows.targetPlatform &&
    o.options.windows.targetPlatform === "win32"
  ) {
    o.options.windows.targetPlatform = "x64";
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
