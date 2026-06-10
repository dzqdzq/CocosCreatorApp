Object.defineProperty(exports, "__esModule", { value: true });
exports.PreviewRowAux = undefined;

const {
  defineComponent,
  ref,
  computed,
  unref,
  watch,
} = require("vue/dist/vue.js");

const { cloneDeep } = require("lodash");

const animation_ctrl_1 = require("../../share/animation-ctrl");
const animation_editor_1 = require("../../share/animation-editor");
const grid_ctrl_1 = require("../../share/grid-ctrl");

const { checkCtrlOrCommand } = require("../../utils");

const pop_menu_1 = require("../../share/pop-menu");

const { getPopMenuMap } = pop_menu_1;

const global_data_1 = require("../../share/global-data");

const { useBaseStore, useAuxCurveStore, useTickUpdate } = require("../hooks");

const template = `
  <div :style="elStyle" class="content-item preview-row">
      <div
          tabindex="-1"
          class="row-wrap"
          :style="wrapStyle"
          @mousedown.self="onRowMousedown"
          @contextmenu="onRowContextmenu"
      >
          <!-- 关键帧显示 -->
          <div
              v-for="(frame, index) in keyFrames"
              :key="getFrameKey(frame)"
              :style="queryKeyStyle(frame.x)"
              :index="index"
              class="key"
              name="aux-key"
              @mousedown="onKeyMousedown($event, index)"
              @contextmenu="onKeyContextmenu($event, index)"
          ></div>

          <div
              v-for="(item, index) in selectKey"
              :key="'active_' + getFrameKey(item)"
              :style="queryKeyStyle(item.x)"
              class="active key"
              name="key"
          ></div>
      </div>
  </div>
`;

exports.PreviewRowAux = defineComponent({
  name: "PreviewRowAux",
  props: {
    name: { type: String, default: "" },
    keyFrames: { type: Array, default: () => [] },
    selectInfo: { type: Object, default: undefined },
    scroll: { type: Object, default: undefined },
    listIndex: { type: Number, default: 0 },
    offset: { type: Number, default: 0 },
    updateFrame: { type: Number, default: 0 },
    updatePosition: { type: Number, default: 0 },
    updateSelect: { type: Number, default: 0 },
    hidden: { type: Boolean, default: false },
  },
  emits: {
    "select-key": null,
    "remove-key": null,
    "paste-key": null,
    "create-key": null,
  },
  setup(l, m) {
    const s = useBaseStore();
    const i = useAuxCurveStore();
    const a = ref([]);

    const e = computed(
      () =>
        l.listIndex * animation_editor_1.animationEditor.LINE_HEIGHT -
        (l.scroll?.top ?? 0)
    );

    var t = computed(() => ({
      transform: `translateY(${unref(e)}px)`,
    }));

    var r = computed(() => ({
      transform: `translateX(${l.offset}px)`,
    }));

    async function p(e) {
      var t;
      var i_copyKeyframeSnap = i.copyKeyframeSnap;
      if (i_copyKeyframeSnap != null) {
        t = {
          ...i_copyKeyframeSnap.curve,
          newValue: i_copyKeyframeSnap.dump.value,
        };

        return animation_ctrl_1.animationCtrl.copyAuxKey(
          {
            name: i_copyKeyframeSnap.name,
            frame: i_copyKeyframeSnap.frame,
            data: t,
          },
          { name: l.name, frame: e, data: t }
        );
      }
    }
    function n() {
      global_data_1.Flags.mouseDownName = "";
      global_data_1.Flags.startDragGridInfo = null;
    }
    function o(e) {
      let t = false;
      var a = getPopMenuMap(pop_menu_1.onAuxKeyContextMenus, false);
      const l_name = l.name;
      const n = l.keyFrames[e].frame;
      let o = [n];
      if (l.selectInfo && Array.isArray(l.selectInfo.keyframes)) {
        for (const u of l.selectInfo.keyframes) {
          if (u.key === l_name && u.frame === n) {
            t = true;
            break;
          }
        }

        if (t) {
          o = l.selectInfo.keyframes.map((e) => e.frame);
        }
      }
      o = Array.from(new Set(o));
      a.copyAuxKey.enabled = o.length > 0;

      a.copyAuxKey.click = () => {
        var t;
        var e;

        if (o.length >= 1) {
          t = n;

          (e = l.keyFrames.find((e) => e.frame === t)) &&
            e.curve != null &&
            e.dump != null &&
            ((e = {
              clip: s.currentClip,
              name: l.name,
              frame: e.frame,
              curve: cloneDeep(e.curve),
              dump: cloneDeep(e.dump),
            }),
            i.setCopyKeyframe(e));
        }
      };

      if (i.copyKeyframeSnap != null) {
        a.pasteAuxKey.enabled = true;

        a.pasteAuxKey.click = () => {
          p(n).then(() => {
            m.emit("paste-key", l_name, n);
          });
        };
      } else {
        a.pasteAuxKey.enabled = false;
      }

      a.removeAuxKey.enabled = true;

      a.removeAuxKey.click = () => {
        animation_ctrl_1.animationCtrl.removeAuxKey(l_name, n).then(() => {
          m.emit("remove-key", l_name, n);

          if (t) {
            m.emit("select-key", l_name, null);
          }
        });
      };

      return Object.values(a);
    }

    watch(
      () => l.selectInfo,
      (e, t) => {
        a.value = e
          ? ((t) => {
              if (
                !t ||
                !t.keyframes ||
                !animation_ctrl_1.animationCtrl.clipsDump
              ) {
                return [];
              }
              var a = [];
              var r = new Set();
              var l_keyFrames = l.keyFrames;
              for (let e = 0; e < l_keyFrames.length; e++) {
                const u = l_keyFrames[e];
                var o;

                if (!r.has(u.frame)) {
                  if (
                    null !=
                    (o = t.keyframes.find(
                      (e) => e.key === u.prop && u.frame === e.rawFrame
                    ))
                  ) {
                    a.push({
                      key: o.key,
                      frame: o.frame,
                      rawFrame: o.rawFrame,
                      x: o.x,
                      offsetFrame: o.offsetFrame,
                    });

                    r.add(o.frame);
                  }
                }
              }
              return a;
            })(e)
          : [];
      }
    );

    useTickUpdate(
      () => l.updatePosition,
      () => {
        var e = unref(a);
        if (e.length > 0) {
          for (const t of e) {
            t.x = grid_ctrl_1.gridCtrl.frameToCanvas(t.frame);
          }
        }
      }
    );

    return {
      selectKey: a,
      elStyle: t,
      wrapStyle: r,
      getKeyMenu: o,
      queryKeyStyle(e) {
        return {
          transform: `translateX(${
            Number.isFinite(e) ? e : 0
          }px) translateX(-50%) rotate(45deg)`,
        };
      },
      getFrameKey(e) {
        return e.frame + "__" + e.prop;
      },
      onKeyMousedown(e, t) {
        var a;

        if (
          e.button === 0 &&
          !((a = checkCtrlOrCommand(e)),
          (t = l.keyFrames[t]),
          (t = {
            keyframes: [
              {
                key: l.name,
                rawFrame: t.frame,
                frame: t.frame,
                x: t.x,
                offsetFrame: 0,
              },
            ],
            ctrl: a,
            offset: 0,
            offsetFrame: 0,
            startX: e.x,
          }),
          m.emit("select-key", l.name, t),
          a)
        ) {
          global_data_1.Flags.mouseDownName = "aux-key";
        }
      },
      onKeyContextmenu(e, t) {
        e.stopPropagation();
        n();
        var a = o(t);

        if (-1 < t && t <= l.keyFrames.length - 1) {
          t = l.keyFrames[t];
          a.push({ label: "Frame: " + t.frame, enabled: false });
        }

        Editor.Menu.popup({ x: e.pageX, y: e.pageY + 10, menu: a });
      },
      onRowMousedown(e) {
        m.emit("select-key", l.name, null);
      },
      onRowContextmenu(e) {
        e.stopPropagation();
        n();
        var t = ((e) => {
          const t = getPopMenuMap(pop_menu_1.onAuxRowContextMenus, false);

          const l_name = l.name;

          t.createAuxKey = {
            ...pop_menu_1.popMenuMap.createAuxKey,
            enabled: true,
            click() {
              animation_ctrl_1.animationCtrl
                .createAuxKey(l_name, e)
                .then(() => {
                  m.emit("create-key", l_name, e);
                });
            },
          };

          if (i.copyKeyframeSnap != null) {
            t.pasteAuxKey.enabled = true;

            t.pasteAuxKey.click = () => {
              p(e).then(() => {
                m.emit("paste-key", l_name, e);
              });
            };
          }

          return Object.values(t);
        })((e = grid_ctrl_1.gridCtrl.pageToFrame(e.x)));
        t.push({ ...pop_menu_1.popMenuMap.separator });
        t.push({ label: "frame: " + e, enabled: false });
        Editor.Menu.popup({ menu: t });
      },
    };
  },
  template,
});
