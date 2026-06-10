var __awaiter =
  (this && this.__awaiter) ||
  ((e, o, s, c) =>
    new (s = s || Promise)((a, t) => {
      function r(e) {
        try {
          n(c.next(e));
        } catch (e) {
          t(e);
        }
      }
      function i(e) {
        try {
          n(c.throw(e));
        } catch (e) {
          t(e);
        }
      }
      function n(e) {
        var t;

        if (e.done) {
          a(e.value);
        } else {
          ((t = e.value) instanceof s
            ? t
            : new s((e) => {
                e(t);
              })
          ).then(r, i);
        }
      }
      n((c = c.apply(e, o || [])).next());
    }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
exports.methods = {
  "create-build-template"() {
    return __awaiter(this, undefined, undefined, function* () {
      var e = path_1
        .join(__dirname, "../static/build-template/game.ejs")
        .replace("app.asar", "app.asar.unpacked");

      var t = path_1.join(
        Editor.Project.path,
        "build-templates",
        "wechatgame",
        path_1.basename(e)
      );

      if (
        fs_extra_1.existsSync(t) &&
        (yield Editor.Dialog.warn("Do you want to overwrite the source file?", {
          buttons: ["Yes", "Cancel"],
          default: 0,
          cancel: 1,
        })).response === 1
      ) {
        return false;
      }
      fs_extra_1.copySync(e, t);

      fs_extra_1.writeJSONSync(
        path_1.join(Editor.Project.path, "build-templates", ".wechatgame"),
        { version: Editor.App.version }
      );

      console.log(
        `wechatgame ${Editor.I18n.t(
          "wechatgame.tips.creat_template_success"
        )}({link(${t})})`
      );
    });
  },
};
