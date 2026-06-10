Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.watch = undefined;
exports.props = undefined;
exports.template = undefined;
exports.data = data;
exports.mounted = mounted;

const { readFileSync } = require("fs");

const { join } = require("path");

function data() {
  return { type: "global" };
}
async function mounted() {
  this.refresh();
}

exports.template = readFileSync(
  join(__dirname, "../../../static/settings/item.html"),
  "utf8"
);

exports.props = ["item", "tab", "path"];

exports.watch = {
  tab() {
    this.refresh();
  },
};

exports.methods = {
  t(t) {
    return t.startsWith("i18n:") ? Editor.I18n.t(t.substr(5)) : t;
  },
  async refresh() {
    var t;
    var e = this;

    if (e.tab) {
      t = await Editor.Profile.getConfig(e.tab, e.path, "local");
      e.type = t != null ? "local" : "global";
    }
  },
  popup(t, e, r) {
    const a = this;

    if (a.tab) {
      Editor.Menu.popup({
        x: t,
        y: e,
        menu: [
          {
            label: Editor.I18n.t("preferences.menu.copyConfigKey"),
            click() {
              var t = `'${a.tab}', '${r}'`;
              Editor.Clipboard.write("text", t);
            },
          },
          {
            label: Editor.I18n.t("preferences.menu.copyTabKey"),
            click() {
              Editor.Clipboard.write("text", `'${a.tab}'`);
            },
          },
          {
            label: Editor.I18n.t("preferences.menu.move_local"),
            enabled: a.type === "global",
            async click() {
              var t = await Editor.Profile.getConfig(a.tab, r);
              await Editor.Profile.setConfig(a.tab, r, t);
              a.refresh();
            },
          },
          {
            label: Editor.I18n.t("preferences.menu.move_global"),
            enabled: a.type === "local",
            async click() {
              var t = await Editor.Profile.getConfig(a.tab, r, "local");
              await Editor.Profile.setConfig(a.tab, r, t, "global");
              await Editor.Profile.removeConfig(a.tab, r, a.type);
              a.refresh();
            },
          },
        ],
      });
    }
  },
  getRenderText() {
    var t = this;
    t.item.render.attributes = t.item.render.attributes || {};
    t.item.render.attributes.path = t.path;
    return JSON.stringify(t.item.render);
  },
};
