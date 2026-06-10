async function migrateLocal(e) {
  if (e.options && e.options.wechatgame) {
    e = e.options.wechatgame;

    (
      await Editor.Profile.getProject("engine", "modules.includeModules")
    ).includes("physics-ammo")
      ? (e.wasm = "wasm")
      : (e.wasm = "js");
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
