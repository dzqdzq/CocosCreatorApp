Object.defineProperty(exports, "__esModule", { value: true });

exports.model = undefined;
exports.methods = undefined;
exports.components = undefined;
exports.props = undefined;
exports.template = undefined;
exports.name = undefined;

exports.data = data;
exports.mounted = mounted;
const fs_extra_1 = require("fs-extra");

const { readFileSync, existsSync, copy } = fs_extra_1;

const { join, basename } = require("path");

const panel_1 = require("../panel");
const MAX_NODE_ICON_SIZE = 5242880;
function data() {
  return {};
}
function mounted() {}
exports.name = "groups";

exports.template = readFileSync(
  join(__dirname, "../../static/template/groups.html"),
  "utf8"
);

exports.props = ["groups", "active"];
exports.components = { "group-items": require("./group-items") };

exports.methods = {
  onDeLete(o) {
    this.groups.forEach((t) => {
      for (let e = 0; e < t.items.length; e++) {
        if (t.items[e].assetUuid === o.assetUuid) {
          t.items.splice(e, 1);
        }
      }
    });

    Editor.Profile.setConfig("node-library", "custom", this.groups);
  },
  async onChangeIcon(t) {
    var e;

    var o = await Editor.Dialog.select({
      filters: [{ name: "Images", extensions: ["jpg", "png"] }],
      multi: false,
    });

    if (!o.canceled) {
      o = o.filePaths[0];

      existsSync(o) &&
        ((await fs_extra_1.promises.stat(o)).size > MAX_NODE_ICON_SIZE
          ? Editor.Dialog.error(
              Editor.I18n.t("node-library.ImageSmallerThen5mb")
            )
          : ((e = basename(o)),
            (e = join(Editor.App.home, "user-static", "node-library", e)),
            await copy(o, e),
            ((o =
              (await Editor.Profile.getConfig("node-library", "custom")) ||
              panel_1.defaultCustomData)[0].items.find(
              (e) => e.assetUuid === t.assetUuid
            ).icon = e),
            this.$emit("change", o),
            Editor.Profile.setConfig("node-library", "custom", o)));
    }
  },
  async onRename(t) {
    if (t.name.trim()) {
      for (const o of this.groups) {
        if (o.items.find((e) => e.name === t.name)) {
          return void Editor.Dialog.warn(
            Editor.I18n.t("node-library.tips.customNodeExist")
          );
        }
        var e = o.items.find((e) => e.assetUuid === t.assetUuid);

        if (e) {
          e.name = t.name;
          Editor.Profile.setConfig("node-library", "custom", this.groups);
        }
      }
    } else {
      Editor.Dialog.warn(Editor.I18n.t("node-library.tips.notEmpty"));
    }
  },
};

exports.model = { prop: "groups", event: "change" };
