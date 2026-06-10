var __awaiter =
  (this && this.__awaiter) ||
  ((e, s, r, c) =>
    new (r = r || Promise)((i, t) => {
      function n(e) {
        try {
          a(c.next(e));
        } catch (e) {
          t(e);
        }
      }
      function o(e) {
        try {
          a(c.throw(e));
        } catch (e) {
          t(e);
        }
      }
      function a(e) {
        var t;

        if (e.done) {
          i(e.value);
        } else {
          ((t = e.value) instanceof r
            ? t
            : new r((e) => {
                e(t);
              })
          ).then(n, o);
        }
      }
      a((c = c.apply(e, s || [])).next());
    }));
async function migrateLocal(t) {
  var e;

  if (t.options && t.options["bytedance-mini-game"]) {
    t.options["bytedance-mini-game"].physX = t.options["bytedance-mini-game"]
      .physX || {
      use: "project",
      notPackPhysXLibs: false,
      multiThread: false,
      subThreadCount: 1,
      epsilon: 0.001,
    };

    e = t.options["bytedance-mini-game"].physX;

    (
      await Editor.Profile.getProject("engine", "modules.includeModules")
    ).includes("physics-physx")
      ? (e.use = "physX")
      : (e.use = "project");
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = undefined;
exports.migrateLocal = migrateLocal;
