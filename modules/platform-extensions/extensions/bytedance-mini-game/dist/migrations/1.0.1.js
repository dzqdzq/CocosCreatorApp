async function migrateLocal(e) {
  if (e.options && e.options["bytedance-mini-game"]) {
    e.options["bytedance-mini-game"].physX = e.options["bytedance-mini-game"]
      .physX || {
      use: "project",
      notPackPhysXLibs: false,
      multiThread: false,
      subThreadCount: 1,
      epsilon: 0.001,
    };

    e = e.options["bytedance-mini-game"].physX;

    (
      await Editor.Profile.getProject("engine", "modules.includeModules")
    ).includes("physics-physx")
      ? (e.use = "physX")
      : (e.use = "project");
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = migrateLocal;
