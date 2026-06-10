Object.defineProperty(exports, "__esModule", { value: true });
exports.AuxiliaryCurves = undefined;

const { defineComponent, ref, computed, unref } = require("vue/dist/vue.js");

const {
  IApplyOperation,
  addNewAuxiliaryCurve,
  removeAuxiliaryCurve,
  renameAuxiliaryCurve,
} = require("../../share/ipc-event");

const animation_ctrl_1 = require("../../share/animation-ctrl");
const pop_menu_1 = require("../../share/pop-menu");

const { getPopMenuMap } = pop_menu_1;

const animation_editor_1 = require("../../share/animation-editor");

const { useAuxCurveStore } = require("../hooks");

const directives_1 = require("../directives");
const keyframe_btn_1 = require("./keyframe-btn");

const { multiplyTrackWithTimer } = require("../../utils");

const sharedProps = { offset: { type: Number, default: 0 } };

const AuxListItem = defineComponent({
  name: "AuxListItem",
  components: { KeyframeBtn: keyframe_btn_1.KeyframeBtn },
  directives: { AutoFocus: directives_1.AutoFocus },
  props: {
    ...sharedProps,
    name: { type: String, default: "" },
    selected: { type: Boolean, default: false },
    keyframeEmpty: { type: Boolean, default: true },
  },
  emits: { select: null, remove: null, rename: null },
  setup(i, a) {
    const r = ref("");
    const n = useAuxCurveStore();
    var e = computed(() => n.renaming.includes(i.name));
    return {
      tempName: r,
      onNameChange: (e) => {
        r.value = e.target.value;
      },
      onNameConfirm: (e) => {
        r.value = e.target.value;

        a.emit("rename", {
          oldName: i.name,
          newName: unref(r),
        });

        n.switchRename(i.name, false);
        r.value = "";
      },
      onNameBlur: (e) => {
        r.value = "";
        n.switchRename(i.name, false);
      },
      isEditing: e,
      onSwitchFrame: (e) => {
        if (i.keyframeEmpty) {
          animation_ctrl_1.animationCtrl.createAuxKey(i.name);
        } else {
          animation_ctrl_1.animationCtrl.removeAuxKey(i.name);
        }
      },
      onClick: (e) => {
        a.emit("select");
      },
      onContextmenu: (e) => {
        var t = getPopMenuMap(pop_menu_1.onAuxNameContextMenus, true);

        t.removeAuxCurve.click = async () => {
          a.emit("remove");
        };

        t.renameAuxCurve.click = async () => {
          r.value = i.name;
          n.switchRename(i.name, true);
        };

        Editor.Menu.popup({ menu: Object.values(t) });
      },
    };
  },
  template: `
      <div
          :class="{
              selected: selected,
          }"
          class="auxiliary-curves-list-item"
          @click="onClick"
          @contextmenu="onContextmenu"
      >
          <span class="auxiliary-curves-list-item__name">
              <ui-input
                  v-if="isEditing"
                  v-auto-focus
                  :value="tempName"
                  @change="onNameChange"
                  @confirm="onNameConfirm"
                  @blur="onNameBlur"
              ></ui-input>
              <template v-else>{{ name }}</template>
          </span>
          <div class="auxiliary-curves-list-item__operate">
              <KeyframeBtn :empty="keyframeEmpty" @click.native="onSwitchFrame"></KeyframeBtn>
          </div>
      </div>
  `,
});

exports.AuxiliaryCurves = defineComponent({
  name: "AuxiliaryCurvesList",
  components: {
    KeyframeBtn: keyframe_btn_1.KeyframeBtn,
    AuxListItem,
  },
  props: {
    ...sharedProps,
    expand: { type: Boolean, default: false },
    currentClip: { type: String, required: true },
    currentFrame: { type: Number, default: 0 },
  },
  setup(t, e) {
    const i = Editor.I18n.t.bind(Editor.I18n);
    const a = useAuxCurveStore();
    return {
      curves: computed(() => a.curves),
      getListItemKey: (e, t) => t + "__" + e,
      isItemSelected: (e) => {
        var a_selectedCurveName = a.selectedCurveName;
        return (
          a_selectedCurveName != "" && a_selectedCurveName === e.displayName
        );
      },
      isKeyframeEmpty: (e) =>
        e.find((e) => e.frame === t.currentFrame) === undefined,
      onHeaderMousedown: (e) => {
        animation_editor_1.animationEditor.onStartResize(e, "auxCurve");
      },
      onAddClick: () => {
        const e = "aux_curve_" + Date.now();

        IApplyOperation(addNewAuxiliaryCurve(t.currentClip, e)).then(() => {
          a.switchRename(e, true);
        });

        multiplyTrackWithTimer("hippoAnimator", {
          add_auxiliary_curve: 1,
          project_id: Editor.Project.uuid,
          clip_id: t.currentClip,
          version: Editor.App.version,
        });
      },
      onItemSelect: (e) => {
        a.selectedCurveName = e.displayName;
      },
      onItemRemove: (e) => {
        IApplyOperation(removeAuxiliaryCurve(t.currentClip, e.key));
      },
      onItemRename: async (e) => {
        if (a.curveNameMap[e.newName] === undefined) {
          return IApplyOperation(
            renameAuxiliaryCurve(t.currentClip, e.oldName, e.newName)
          );
        }
        e = i("animator.auxiliaryCurve.nameExistedTip", { name: e.newName });

        await Editor.Dialog.info(e, {
          title: i("animator.title"),
          buttons: [i("animator.ok")],
        });
      },
      toggleExpand: () => {
        e.emit("toggle-expand", !t.expand);
      },
    };
  },
  template: `
        <div class="auxiliary-curves">
            <div class="auxiliary-curves__header content-device ns-resize" @mousedown="onHeaderMousedown">
                <ui-icon value="arrow-triangle"
                    :class="expand ? 'expand' : 'collapse'"
                    @click="toggleExpand"
                ></ui-icon>
                <ui-label value="i18n:animator.auxiliaryCurve.title" class="tw-flex-0 tw-min-w-0"></ui-label>
                <ui-icon color="true" value="experiment" class="tw-flex-0"></ui-icon>
                <div class="tw-flex-1"></div>
                <ui-button
                    tooltip="i18n:animator.auxiliaryCurve.createNew"
                    class="icon-btn tw-flex-0"
                    transparent
                    @click="onAddClick"
                >
                    <ui-icon value="add"></ui-icon>
                </ui-button>
            </div>

            <div class="auxiliary-curves__list auxiliary-curves-list">
                <template v-for="(curve, index) in curves">
                    <AuxListItem
                        :key="getListItemKey(curve.displayName, index)"
                        :name="curve.displayName"
                        :keyframe-empty="isKeyframeEmpty(curve.keyframes)"
                        :selected="isItemSelected(curve)"
                        @select="onItemSelect(curve)"
                        @remove="onItemRemove(curve)"
                        @rename="onItemRename"
                    >
                    </AuxListItem>
                </template>
            </div>
        </div>
    `,
});
