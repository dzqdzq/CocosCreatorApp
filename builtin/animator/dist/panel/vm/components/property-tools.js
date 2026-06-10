Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.components = undefined;
exports.watch = undefined;
exports.props = undefined;
exports.template = undefined;

exports.data = data;
const animation_ctrl_1 = require("../../share/animation-ctrl");
const animation_editor_1 = require("../../share/animation-editor");
function data() {
  return { multi: false };
}

exports.template = `
<div class="property-tools tw-items-center"
    @mousedown.stop="$root.onStartResize($event, 'center')"
>
    <div
        @click="$root.toggleExpandLayoutChange('property')"
    >
        <ui-icon value="arrow-triangle"
            :class="$root.expandLayout.property ? 'expand' : 'collapse'"
        ></ui-icon>
        <ui-label value="i18n:animator.property.title"></ui-label>
    </div>
    <div class="right">
        <slot></slot>
        <ui-button class="transparent icon-btn" @mousedown.stop="showPropMenu">
            <ui-icon 
                tooltip="i18n:animator.property.create_prop" 
                value="add" 
            ></ui-icon>
        </ui-button>
    </div>
</div>
`;

exports.props = ["menu", "lock", "selectNode", "nodePath"];

exports.watch = {
  async updateFlag() {
    await this.refresh();
  },
};

exports.components = {};

exports.methods = {
  t(t) {
    return Editor.I18n.t("animator.property." + t);
  },
  createMenu(t) {
    const e = this;
    let o = [];
    var r;
    if (t.key) {
      r = t.menuName || t.displayName;

      o.push({
        label: r,
        enabled: !t.disable,
        click() {
          e.createProp(t.key);
        },
      });
    } else {
      for (const i of Object.keys(t)) {
        var a = t[i];

        if (a.key) {
          o = o.concat(e.createMenu(a));
        } else {
          o.push({ label: i, submenu: e.createMenu(a) });
        }
      }
    }
    return o;
  },
  async createProp(t) {
    let e = false;
    var o = this;
    if (o.selectedIds && o.selectedIds.size > 1) {
      let t = Array.from(o.selectedIds);
      if (
        (t = t.filter(
          (t) => animation_ctrl_1.animationCtrl.nodesDump.uuid2path[t]
        )).length > 1
      ) {
        o = await Editor.Dialog.info(
          Editor.I18n.t("animator.is_add_prop_multi.title"),
          {
            buttons: [
              Editor.I18n.t("animator.is_add_prop_multi.add_to_current"),
              Editor.I18n.t("animator.is_add_prop_multi.add_to_all"),
            ],
            default: 0,
            cancel: -1,
          }
        );
        if (-1 === o.response) {
          return;
        }
        e = !!o.response;
      }
    }
    animation_ctrl_1.animationCtrl.createProp({ prop: t }, e);
  },
  showPropMenu(t) {
    var e = this;

    if (e.lock || (e.nodePath && !e.selectNode)) {
      animation_editor_1.animationEditor.showToast(
        "i18n:animator.property.create_prop_tips"
      );
    } else if (e.menu && e.selectNode) {
      Editor.Menu.popup({ menu: e.menu });
    } else {
      animation_editor_1.animationEditor.showToast(
        "i18n:animator.property.should_select_node_first"
      );

      console.warn(
        "[Animation Editor]" +
          Editor.I18n.t("animator.property.should_select_node_first")
      );
    }
  },
};
