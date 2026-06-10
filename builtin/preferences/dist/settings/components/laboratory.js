Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.props = undefined;
exports.template = undefined;
exports.data = data;
exports.mounted = mounted;

const { readFileSync } = require("fs");

const { join } = require("path");

function data() {
  return {};
}
async function mounted() {}

exports.template = readFileSync(
  join(__dirname, "../../../static/settings/laboratory.html"),
  "utf8"
);

exports.props = ["data"];

exports.methods = {
  popup(e, t, o, r) {
    if (r) {
      Editor.Menu.popup({
        x: e,
        y: t,
        menu: [
          {
            label: Editor.I18n.t("preferences.menu.copyConfigKey"),
            click() {
              Editor.Clipboard.write("text", `'${o}', '${r}'`);
            },
          },
          {
            label: Editor.I18n.t("preferences.menu.copyTabKey"),
            click() {
              Editor.Clipboard.write("text", "'laboratory'");
            },
          },
        ],
      });
    }
  },
};
