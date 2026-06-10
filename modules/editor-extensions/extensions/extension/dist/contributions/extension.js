Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.load = load;
exports.unload = unload;
const requestProgress = require("request-progress");
const request = require("request");

const { ensureDir, createWriteStream, existsSync, copy } = require("fs-extra");

const { dirname, extname, join } = require("path");

const { gte, valid, coerce } = require("semver");

const { handleDecompressFail } = require("../public/utils");

const import_1 = require("../public/import");

const { importPackage } = import_1;

function load() {}
function unload() {}
exports.methods = {
  async isCreator3DPackage(e) {
    if (e.dependency) {
      return gte(valid(coerce(e.dependency)), "3.0.0");
    }
  },
  async downloadZip(o, a) {
    await ensureDir(dirname(o.file));

    return new Promise((t, r) => {
      var e = encodeURI(o.url);
      requestProgress(request(e), { delay: 300 })
        .on("progress", (e) => {
          o.downloadProgress = e.percent;
          a();
        })
        .on("error", (e) => {
          r(e);
        })
        .on("end", (e, r) => {
          o.downloadProgress = 1;
          a();
          t(null);
        })
        .pipe(createWriteStream(o.file));
    });
  },
  async installExtension(r, e) {
    var t = (Editor.I18n.getLanguage() === "en" && r.name_en) || r.name;
    if (!existsSync(r.file)) {
      throw new Error(Editor.I18n.t("extension.store.install_exists_error"));
    }
    if (extname(r.file) !== ".zip") {
      throw new Error(Editor.I18n.t("extension.store.install_exname_error"));
    }
    var o = Editor.I18n.getLanguage() === "zh" ? r.name : r.name_en;

    var o = await Editor.Dialog.info(
      Editor.I18n.t("extension.store.install_package", { name: o }),
      {
        cancel: 2,
        buttons: [
          Editor.I18n.t("extension.create_package.global"),
          Editor.I18n.t("extension.create_package.local"),
          Editor.I18n.t("extension.create_package.cancel"),
        ],
      }
    );

    if (o.response === 2) {
      throw new Error("cancel");
    }
    try {
      var a = await importPackage(
        o.response === 0 ? "global" : "project",
        r.file,
        { extensionDisplayName: t }
      );
      await Editor.Message.request("extension", "enable", a, true);
    } catch (e) {
      o = e.message;
      if (o !== import_1.ImportPackageErrorMessage.decompressFail) {
        throw new Error(o);
      }
      handleDecompressFail(r.file, t, false);
    }
  },
  async copyZip(e, r) {
    var t = Editor.I18n.getLanguage() === "zh" ? e.name : e.name_en;

    var o = await Editor.Dialog.select({
      title: Editor.I18n.t("cloud-component.store.copy_to_directory"),
      type: "directory",
    });

    if (!o || !o.filePaths[0]) {
      throw new Error("cancel");
    }
    await copy(e.file, join(o.filePaths[0], t + ".zip"));
  },
};
