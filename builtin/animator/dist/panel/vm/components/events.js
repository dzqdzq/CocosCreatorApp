Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.components = undefined;
exports.computed = undefined;
exports.watch = undefined;
exports.props = undefined;
exports.template = undefined;

exports.data = data;
exports.mounted = mounted;
const animation_ctrl_1 = require("../../share/animation-ctrl");
const animation_editor_1 = require("../../share/animation-editor");
const pop_menu_1 = require("../../share/pop-menu");

const { getPopMenuMap } = pop_menu_1;

const { checkCtrlOrCommand } = require("../../utils");

function data() {
  return {};
}
function mounted() {}

exports.template = `
<div class="events" :style="'transform: translateX(' + offset + 'px)'">
    <template
        v-if="events"
        v-for="(info, index) in events"
    >
        <ui-icon value="key-empty"
            :style="queryKeyStyle(info.x)"
            :index="index"
            name="event"
            @mousedown="onMouseDown($event, info)"
            @click.right="onPopMenu($event, info.frame)"
            @dblclick="openEventEditor(info.frame)"
        ></ui-icon>
    </template>
    <template
        v-if="selectEvent"
        v-for="(info, index) in selectEvent"
    >
        <ui-icon value="key" class="preview"
            name="event"
            :style="queryKeyStyle(info.x)"
        ></ui-icon>
    </template>
</div>
`;

exports.props = ["events", "offset", "selectInfo"];
exports.watch = {};

exports.computed = {
  selectEvent() {
    return this.selectInfo ? this.selectInfo.data : null;
  },
};

exports.components = {};

exports.methods = {
  t(e, t = "event.") {
    return Editor.I18n.t("animator." + t + e);
  },
  display(e) {
    return e >= 0;
  },
  onPopMenu(e, t) {
    const n = this;
    var o = getPopMenuMap(pop_menu_1.onEventMenus, true);

    o.editEventKey.click = () => {
      n.openEventEditor(t);
    };

    o.copyEventKey.click = () => {
      animation_ctrl_1.animationCtrl.copyEvents(
        n.selectEvent ? n.selectEvent.map((e) => e.frame) : [t]
      );
    };

    o.pasteEventKey.enabled = !!animation_ctrl_1.animationCtrl.copyEventInfo;

    o.pasteEventKey.click = () => {
      animation_ctrl_1.animationCtrl.pasteEvent(t);
    };

    o.removeEventKey.click = () => {
      animation_ctrl_1.animationCtrl.deleteEvent(
        n.selectEvent ? n.selectEvent.map((e) => e.frame) : [t]
      );
    };

    Editor.Menu.popup({ menu: Object.values(o) });
  },
  onMouseDown(t, n) {
    var o = this;
    t.stopPropagation();

    if (t.button === 0) {
      let e = {};
      var a = JSON.parse(JSON.stringify(n));
      var i = o.selectInfo && o.selectInfo.frames.indexOf(n.frame);
      var r = checkCtrlOrCommand(t);

      if (r && o.selectInfo) {
        e = JSON.parse(JSON.stringify(o.selectInfo));

        -1 !== i
          ? (e.data.splice(i, 1), e.frames.splice(i, 1))
          : (e.data.push(a), e.frames.push(n.frame));
      } else {
        e =
          typeof i != "number" || -1 === i
            ? {
                startX: t.x,
                data: [a],
                offset: 0,
                offsetFrame: 0,
                frames: [n.frame],
              }
            : ((o.selectInfo.startX = t.x), o.selectInfo);
      }

      animation_editor_1.animationEditor.startDragEvent(e, r);
    }
  },
  openEventEditor(e) {
    animation_editor_1.animationEditor.openEventEditor(e);
  },
  queryKeyStyle(e) {
    return `transform: translateX(${(e - 6) | 0}px);`;
  },
};
