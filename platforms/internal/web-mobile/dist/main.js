var __awaiter =
  (this && this.__awaiter) ||
  ((e, n, s, l) =>
    new (s = s || Promise)((r, t) => {
      function i(e) {
        try {
          a(l.next(e));
        } catch (e) {
          t(e);
        }
      }
      function o(e) {
        try {
          a(l.throw(e));
        } catch (e) {
          t(e);
        }
      }
      function a(e) {
        var t;

        if (e.done) {
          r(e.value);
        } else {
          ((t = e.value) instanceof s
            ? t
            : new s((e) => {
                e(t);
              })
          ).then(i, o);
        }
      }
      a((l = l.apply(e, n || [])).next());
    }));
Object.defineProperty(exports, "__esModule", { value: true });
exports.load = undefined;
exports.methods = undefined;
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const server_1 = require("./server");
const electron_1 = require("electron");
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
      r === "web-mobile") &&
      typeof t == "string"
    ) {
      r = path_1.join(Editor.UI.File.resolveToRaw(t), e.options.outputName);

      server_1.setRootPath(r);
    }
  });
}
async function getPreviewUrl(t) {
  var e = await Editor.Message.request("server", "query-port");
  return `http://${await Editor.Message.request(
    "preview",
    "get-preview-ip"
  )}:${e}/web-mobile/${t}/index.html`;
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
        "web-mobile",
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
        `web-mobile ${Editor.I18n.t(
          "web-mobile.tips.creat_template_success"
        )}({link(${t})})`
      );
    });
  },
  preview(t) {
    return __awaiter(this, undefined, undefined, function* () {
      server_1.setRootPath(t);
      var e = yield getPreviewUrl(path_1.basename(t));
      electron_1.shell.openExternal(e);
      return e;
    });
  },
  "set-preview-path"(t) {
    return __awaiter(this, undefined, undefined, function* () {
      server_1.setRootPath(t);
      var e = yield getPreviewUrl(path_1.basename(t));
      fs_extra_1.existsSync(t);
      return e;
    });
  },
};

exports.load = load;
