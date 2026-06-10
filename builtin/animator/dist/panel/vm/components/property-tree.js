Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.computed = undefined;
exports.watch = undefined;
exports.props = undefined;
exports.template = undefined;

exports.data = data;
const animation_ctrl_1 = require("../../share/animation-ctrl");
const animation_editor_1 = require("../../share/animation-editor");
const pop_menu_1 = require("../../share/pop-menu");

const { getPopMenuMap } = pop_menu_1;

function data() {
  return {};
}

exports.template = `
<div :class="propertyClass"
    v-if="dumps"
    :missing="dumps.missing"
    :selected="selected"
    @mousedown.stop="onMouseDown"
>
    <div class="property-content" :part="dumps.isPart">
        <ui-icon class="arrow" v-if="typeof(isExpand) === 'boolean'" :expand="isExpand" value="arrow-triangle" @click.stop="onExpandClick($event)"></ui-icon>
        <span v-if="dumps.isPart" style="padding-left: 20px;"></span>
        <ui-label class="name" :tooltip="dumps.displayName + (dumps.missing ? '(missing)' : '')">{{dumps.displayName}}{{dumps.missing ? '(missing)' : ''}}</ui-label>
    </div>
    <div class="right">
        <ui-icon v-if="color && typeof(isExpand) !== 'boolean'" class="curve" value="line" :style="{ 'color': color }"></ui-icon>
        <ui-icon v-else class="curve" value="line"></ui-icon>
        <span class="operate">
            <i class="key"
                name="key"
                :empty="empty"
                :tooltip="operateTitle"
            ></i>
        </span>
    </div>
</div>
`;

exports.props = [
  "keyFrames",
  "frame",
  "prop",
  "type",
  "nodePath",
  "select",
  "lock",
  "missing",
  "index",
  "isExpand",
  "color",
  "empty",
];

exports.watch = {};

exports.computed = {
  dumps() {
    var e = this;
    if (e.nodePath) {
      var t = animation_ctrl_1.animationCtrl.getPropData(e.nodePath, e.prop);
      if (t) {
        return {
          displayName: t.displayName,
          isPart: t.parentPropKey !== undefined,
          missing: e.missing,
          isCurveSupport: t.isCurveSupport,
        };
      }
    }
  },
  propertyClass() {
    let e = "";
    return (
      "content-item property " + (e = this.index % 2 == 0 ? "dark" : "light")
    );
  },
  selected() {
    var e = this;
    return (
      e.select && e.nodePath === e.select.nodePath && e.select.prop === e.prop
    );
  },
  lightCurve() {
    var e;
    var t;
    var a = this;
    return (
      !!a.select &&
      (({ nodePath: t, prop: e } = a.select),
      !(t = animation_ctrl_1.animationCtrl.clipsDump.pathsDump[t][e]) ||
        (e === a.prop && !t.partKeys) ||
        !(!t.partKeys || !t.partKeys.includes(a.prop)))
    );
  },
  operateTitle() {
    var e = this;
    return e.empty ? e.t("create_key") : e.t("remove_key");
  },
  params() {
    var e = this;
    return { prop: e.prop, nodePath: e.nodePath, type: e.type };
  },
  disabled() {
    return this.lock;
  },
};

exports.methods = {
  t(e) {
    return Editor.I18n.t("animator.property." + e);
  },
  createPopMenuData(e, t, a, r, o) {
    return {
      label: this.t(e),
      click() {
        animation_ctrl_1.animationCtrl[t](a);
      },
      enabled: r,
      accelerator: o ? o.accelerator : undefined,
    };
  },
  onMouseDown(e) {
    if (e.target) {
      const a = this;
      var t = e.target.getAttribute("name");

      if (t === "showPopMenu" || e.button === 2) {
        (e = getPopMenuMap(pop_menu_1.onPropMenus, true)).copyProp.enabled =
          !a.lock;

        e.copyProp.click = () => {
          animation_ctrl_1.animationCtrl.copyProp(a.params);
        };

        e.pasteProp.enabled = !a.lock && a.canPaste();

        e.pasteProp.click = () => {
          animation_ctrl_1.animationCtrl.pasteProp(a.params);
        };

        e.clearPropKeys.click = () => {
          animation_ctrl_1.animationCtrl.clearPropKeys(a.params);
        };

        e.removeProp.enabled = !a.dumps.isPart;

        e.removeProp.click = () => {
          animation_ctrl_1.animationCtrl.removeProp(a.params);
        };

        Editor.Menu.popup({ menu: Object.values(e) });
      } else if (t !== "key") {
        animation_editor_1.animationEditor.updateSelectProperty({
          nodePath: a.nodePath,
          prop: a.prop,
          clipUuid: animation_ctrl_1.animationCtrl.clipsDump.uuid,
          isCurveSupport: a.dumps.isCurveSupport,
        });
      } else if (!a.disabled) {
        if (a.empty) {
          animation_ctrl_1.animationCtrl.createKey({
            nodePath: a.nodePath,
            prop: a.prop,
          });
        } else {
          animation_ctrl_1.animationCtrl.removeKey(
            { nodePath: a.nodePath, prop: a.prop },
            true
          );
        }
      }
    }
  },
  onExpandClick() {
    animation_editor_1.animationEditor.updatePropExpandState(
      this.prop,
      !this.isExpand
    );
  },
  canPaste() {
    var e = animation_ctrl_1.animationCtrl.copyPropInfo;
    if (e && this.type) {
      for (const t of e.curvesDump) {
        if (t.type.value === this.type.value) {
          return true;
        }
      }
    }
    return false;
  },
};
