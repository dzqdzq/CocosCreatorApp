Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.props = undefined;
exports.template = undefined;
exports.name = undefined;
exports.data = data;
exports.mounted = mounted;

const { readFileSync } = require("fs-extra");

const { join } = require("path");

exports.name = "group-items";

exports.template = readFileSync(
  join(__dirname, "../../static/template/group-items.html"),
  "utf8"
);

exports.props = ["item", "active"];
let renameNode;
function data() {
  return { state: "", renameValue: "" };
}
function mounted() {
  this.state = "";
  this.renameValue = "";
}
exports.methods = {
  getAdditional(e) {
    var t = [];
    t.push(Object.assign({ value: e.assetUuid }, e));
    return JSON.stringify(t);
  },
  popupMenu(e) {
    const t = this;
    var a;

    if (t.active === "custom") {
      a = [
        {
          label: Editor.I18n.t("node-library.menu.delete"),
          click() {
            t.$emit("delete", e);
          },
        },
        {
          label: Editor.I18n.t("node-library.menu.locate"),
          click() {
            Editor.Message.send("assets", "twinkle", e.assetUuid);
          },
        },
        {
          label: Editor.I18n.t("node-library.menu.changeIcon"),
          async click() {
            t.$emit("changeIcon", e);
          },
        },
        {
          label: Editor.I18n.t("node-library.menu.rename"),
          async click() {
            renameNode = Object.assign({}, e);
            t.renameValue = renameNode.name;
            t.state = "rename";

            window.setTimeout(() => {
              if (t.$refs.renameInput) {
                t.$refs.renameInput.focus();
                t.$refs.renameInput.setSelectionRange(0, e.name.length);
              }
            });
          },
        },
      ];

      Editor.Menu.popup({ menu: a });
    }
  },
  renameSubmit() {
    var e = this;

    if (e.state === "rename" && e.renameValue !== e.item.name) {
      renameNode.name = e.renameValue;
      e.$emit("rename", renameNode);
    }

    e.renameValue = "";
    e.state = "";
  },
  renameCancel() {
    this.renameValue = "";
    this.state = "cancel";
  },
};
