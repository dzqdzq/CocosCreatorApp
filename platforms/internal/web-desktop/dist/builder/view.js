var __awaiter =
  (this && this.__awaiter) ||
  ((t, a, u, s) =>
    new (u = u || Promise)((i, e) => {
      function n(t) {
        try {
          r(s.next(t));
        } catch (t) {
          e(t);
        }
      }
      function o(t) {
        try {
          r(s.throw(t));
        } catch (t) {
          e(t);
        }
      }
      function r(t) {
        var e;

        if (t.done) {
          i(t.value);
        } else {
          ((e = t.value) instanceof u
            ? e
            : new u((t) => {
                t(e);
              })
          ).then(n, o);
        }
      }
      r((s = s.apply(t, a || [])).next());
    }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.buttonConfig = undefined;
const path_1 = require("path");
exports.buttonConfig = {
  configs: {
    run: {
      label: "i18n:web-desktop.run.label",
      click(t, e) {
        return __awaiter(this, undefined, undefined, function* () {
          e.buildPath = Editor.UI.File.resolveToRaw(e.buildPath);
          var t = path_1.join(e.buildPath, e.outputName);
          yield Editor.Message.request("web-desktop", "preview", t);
        });
      },
    },
  },
};
