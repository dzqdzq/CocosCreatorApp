var __awaiter =
  (this && this.__awaiter) ||
  ((e, r, c, s) =>
    new (c = c || Promise)((o, t) => {
      function i(e) {
        try {
          a(s.next(e));
        } catch (e) {
          t(e);
        }
      }
      function n(e) {
        try {
          a(s.throw(e));
        } catch (e) {
          t(e);
        }
      }
      function a(e) {
        var t;

        if (e.done) {
          o(e.value);
        } else {
          ((t = e.value) instanceof c
            ? t
            : new c((e) => {
                e(t);
              })
          ).then(i, n);
        }
      }
      a((s = s.apply(e, r || [])).next());
    }));
async function migrateLocal(t) {
  var e;

  if (t.options && t.options.wechatgame) {
    e = t.options.wechatgame;

    (
      await Editor.Profile.getProject("engine", "modules.includeModules")
    ).includes("physics-ammo")
      ? (e.wasm = "wasm")
      : (e.wasm = "js");
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateLocal = undefined;
exports.migrateLocal = migrateLocal;
