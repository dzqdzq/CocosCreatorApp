var __awaiter =
  (this && this.__awaiter) ||
  ((e, s, n, p) =>
    new (n = n || Promise)((r, t) => {
      function o(e) {
        try {
          i(p.next(e));
        } catch (e) {
          t(e);
        }
      }
      function a(e) {
        try {
          i(p.throw(e));
        } catch (e) {
          t(e);
        }
      }
      function i(e) {
        var t;

        if (e.done) {
          r(e.value);
        } else {
          ((t = e.value) instanceof n
            ? t
            : new n((e) => {
                e(t);
              })
          ).then(o, a);
        }
      }
      i((p = p.apply(e, s || [])).next());
    }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.load = undefined;
exports.methods = undefined;
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const electron_1 = require("electron");
const server_1 = require("./server");
const lodash = require("lodash");
async function load() {
  var e =
    (await Editor.Profile.getConfig("builder", "BuildTaskManager.taskMap")) ||
    {};
  Object.values(e).forEach((e) => {
    var t;
    var r;

    if (
      e.progress === 1 &&
      ((r = lodash.get(e, "options.platform")),
      (t = lodash.get(e, "options.buildPath")),
      r === "web-desktop") &&
      typeof t == "string"
    ) {
      r = path_1.join(Editor.UI.File.resolveToRaw(t), e.options.outputName);

      server_1.setRootPath(r);
    }
  });
}

exports.methods = {
  "create-build-template"() {
    return __awaiter(this, undefined, undefined, function* () {
      var e = path_1
        .join(__dirname, "../static/build-template/index.ejs")
        .replace("app.asar", "app.asar.unpacked");

      var t = path_1.join(
        Editor.Project.path,
        "build-templates",
        "web-desktop",
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

      console.log(
        `web-desktop ${Editor.I18n.t(
          "web-desktop.tips.creat_template_success"
        )}({link(${t})})`
      );
    });
  },
  preview(t) {
    return __awaiter(this, undefined, undefined, function* () {
      server_1.setRootPath(t);
      var e = yield Editor.Message.request("server", "query-port");

      var e = `http://${yield Editor.Message.request(
        "preview",
        "get-preview-ip"
      )}:${e}/web-desktop/${path_1.basename(t)}/index.html`;

      electron_1.shell.openExternal(e);
      return true;
    });
  },
  "set-preview-path"(e) {
    return !!fs_extra_1.existsSync(e) && (server_1.setRootPath(e), true);
  },
};

exports.load = load;
