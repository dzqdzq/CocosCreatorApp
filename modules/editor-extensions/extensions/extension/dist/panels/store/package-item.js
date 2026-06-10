Object.defineProperty(exports, "__esModule", { value: true });

exports.mounted = undefined;
exports.methods = undefined;
exports.data = undefined;
exports.props = undefined;
exports.template = undefined;
exports.name = undefined;

const electron_1 = require("electron");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
function data() {
  return { dev: Editor.App.dev };
}
function mounted() {}
exports.name = "pkg-node";

exports.template = fs_extra_1.readFileSync(
  path_1.join(
    __dirname,
    "../../../static",
    "/template/store/package-item.html"
  ),
  "utf-8"
);

exports.props = ["info", "language"];
exports.data = data;

exports.methods = {
  i18n(e) {
    return Editor.I18n.t(e);
  },
  openFolder() {
    electron_1.shell.showItemInFolder(this.pkg.path);
  },
  isRunning(e) {
    return -1 !== e && e !== 0 && e < 1;
  },
  getDate(t) {
    var n = new Date();
    var o = new Date(t);
    if (n.getTime() - t < 86400000 /* 864e5 */ && n.getDate() == o.getDate()) {
      t = o.getHours();
      n = o.getMinutes();
      let e = "";
      return (e =
        (e += t < 10 ? "0" + t : "" + t) + ":" + (n < 10 ? "0" + n : "" + n));
    }
    return o.toLocaleDateString();
  },
  async removeItem() {
    var { version_id, production_id, name, name_en } = this.info;
    var name = this.language === "zh" ? name : name_en;

    if (
      (
        await Editor.Dialog.info(
          "" +
            Editor.I18n.t("extension.menu.removeConfirm").replace(
              "$name",
              name
            ),
          {
            title: Editor.I18n.t("extension.menu.confirm"),
            default: 0,
            cancel: 1,
            buttons: [
              Editor.I18n.t("extension.store.confirm"),
              Editor.I18n.t("extension.store.cancel"),
            ],
          }
        )
      ).response !== 1
    ) {
      await Editor.Message.request(
        "extension",
        "remove-item",
        version_id,
        production_id
      );
    }
  },
  async installItem() {
    var { version_id, production_id } = this.info;
    await Editor.Message.request(
      "extension",
      "install-item",
      version_id,
      production_id
    );
  },
};

exports.mounted = mounted;
