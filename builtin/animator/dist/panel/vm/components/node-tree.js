Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.components = undefined;
exports.computed = undefined;
exports.watch = undefined;
exports.name = undefined;
exports.props = undefined;
exports.template = undefined;

exports.data = data;
exports.mounted = mounted;
const animation_editor_1 = require("../../share/animation-editor");
const animation_ctrl_1 = require("../../share/animation-ctrl");

const { checkCtrlOrCommand } = require("../../utils");

const pop_menu_1 = require("../../share/pop-menu");

const { getPopMenuMap } = pop_menu_1;

const join = require("path").join;
const readFileSync = require("fs-extra").readFileSync;
function data() {
  return { hoving: false };
}
function mounted() {}

exports.template = readFileSync(
  join(__dirname, "./../../../../static/template/components/node-tree.html"),
  "utf-8"
);

exports.props = [
  "dumps",
  "selectPath",
  "movePath",
  "lock",
  "selectedIds",
  "index",
  "showType",
  "currentFrame",
];

exports.name = "node-tree";
exports.watch = {};

exports.computed = {
  disabled() {
    var e = this;
    return !(!e.lock && e.dumps.uuid && !e.dumps.disabled);
  },
  nodeStyle() {
    return { "padding-left": 4 * this.dumps.indent + "px" };
  },
  nodeClass() {
    var e = this;
    let t = "";
    t = e.index % 2 == 0 ? "dark" : "light";
    var a = e.dumps.disabled ? "disabled" : "";
    return e.movePath && e.movePath === e.dumps.path
      ? `content-item moving ${t} ` + a
      : `content-item ${t} ` + a;
  },
  movingProperty() {
    var e = this;
    return e.movePath && !e.dumps.uuid
      ? "missing"
      : !(!e.movePath || !e.dumps.uuid);
  },
};

exports.components = {};

exports.methods = {
  t(e, t = "node.") {
    return Editor.I18n.t("animator." + t + e);
  },
  async onMouseDown(e, t) {
    var a;
    var o = this;
    if (o.movePath) {
      return o.dumps.uuid && o.movePath !== o.dumps.path
        ? void ((await o.checkMoveData())
            ? animation_ctrl_1.animationCtrl.moveNodeData(t)
            : animation_editor_1.animationEditor.cancelMoveNode())
        : undefined;
    }

    if (e.target.getAttribute("name") === "showPopMenu" || e.button === 2) {
      (a = getPopMenuMap(pop_menu_1.onNodeMenus, true)).copyNodeData.enabled =
        !(o.lock || o.dumps.disabled);

      a.copyNodeData.click = () => {
        animation_ctrl_1.animationCtrl.copyNodeData([t]);
      };

      a.pasteNodeData.enabled = !(
        o.lock ||
        o.dumps.disabled ||
        !animation_ctrl_1.animationCtrl.copyNodeInfo
      );

      a.pasteNodeData.click = () => {
        animation_ctrl_1.animationCtrl.pasteNodeData(t);
      };

      a.moveNodeData.enabled = !o.lock && !o.dumps.disabled;

      a.moveNodeData.click = () => {
        animation_editor_1.animationEditor.startMoveNode(t);
      };

      a.clearNodeData.enabled = !o.lock && !o.dumps.disabled;

      a.clearNodeData.click = () => {
        animation_ctrl_1.animationCtrl.clearNodeKeys(t);
      };

      Editor.Menu.popup({ menu: Object.values(a) });
    } else if (o.selectPath !== t) {
      animation_editor_1.animationEditor.selectNode(t, checkCtrlOrCommand(e));
    }
  },
  onDragStart() {
    animation_editor_1.animationEditor.setMovePath(this.dumps.path);
  },
  onDragEnd() {
    animation_editor_1.animationEditor.cancelMoveNode();
  },
  onDragOver(e) {
    var t = this;

    if (t.movePath && t.dumps.uuid && t.dumps.path !== t.movePath) {
      t.hoving = true;
      e.preventDefault();
    }
  },
  onDragLeave() {
    this.hoving = false;
  },
  onDrop() {
    animation_ctrl_1.animationCtrl.moveNodeData(this.dumps.path);
  },
  async checkMoveData() {
    const t = this;
    var e = (e) => t.t("", e);
    return (
      (
        await Editor.Dialog.warn(e("is_move_data_message"), {
          title: e("is_move_data"),
          buttons: [e("cancel"), e("move")],
          default: 0,
          cancel: 0,
        })
      ).response === 1
    );
  },
};
