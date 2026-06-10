async function migrateLocal(a) {
  if (a.BuildTaskManager && a.BuildTaskManager.taskMap) {
    var e = await Editor.Profile.getProject("engine", "modules.includeModules");
    if (e) {
      const s = e.includes("physics-physx") ? "physX" : "project";
      const t = e.includes("physics-ammo") ? "wasm" : "js";
      e = a.BuildTaskManager.taskMap;
      Object.values(e).forEach((a) => {
        if (
          a.options &&
          ["wechatgame", "bytedance-mini-game"].includes(a.options.platform)
        ) {
          if (a.options.platform === "wechatgame") {
            a.options.packages.wechatgame.wasm = t;
          } else if (a.options.platform === "bytedance-mini-game") {
            a.options.packages["bytedance-mini-game"].physX.use = s;
          }
        }
      });
    }
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
