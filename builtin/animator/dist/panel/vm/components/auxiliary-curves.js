Object.defineProperty(exports, "__esModule", { value: true });
exports.AuxiliaryCurveFrames = undefined;

const {
  ref,
  computed,
  defineComponent,
  toRef,
  watch,
  unref,
} = require("vue/dist/vue.js");

const { isPlainObject } = require("lodash");

const {
  getAuxCurveValueAtFrame,
  IApplyOperation,
  createAuxKey,
} = require("../../share/ipc-event");

const {
  useAuxCurveStore,
  useBaseStore,
  useElementSize,
  useAuxCurveEditor,
} = require("../hooks");

const directives_1 = require("../directives");
const preview_row_aux_1 = require("./preview-row-aux");
const animation_editor_1 = require("../../share/animation-editor");

const template = `
  <div class="auxiliary-curves-frames">
      <div
          class="auxiliary-curves-frames__header content-device property-tools ns-resize"
          @mousedown="onHeaderMousedown"
      >
          <!-- TODO: should use ui-radio-group instead -->
          <div @mousedown.stop>
              <ui-prop
                  v-if="isPropEditable"
                  type="dump"
                  v-prop-dump="renderDump"
                  @change-dump="onFrameValueChange"
                  @confirm-dump="onFrameValueConfirm"
              ></ui-prop>
          </div>
          <div class="icon-group">
              <ui-icon :active="curveVisible" value="curve" @click="showCurve"></ui-icon>
              <ui-icon :active="!curveVisible" value="slider" @click="hideCurve"></ui-icon>
          </div>
      </div>

      <div
          ref="framesArea"
          name="aux-curves"
          class="auxiliary-curves-frames__content"
          @mousedown.self="onCurveAreaMousedown"
      >
          <div v-show="curveVisible" class="tw-full">
              <ui-curve-editor
                  ref="editor"
                  class="tw-block tw-full"
                  tabindex="0"
                  @transform="onTransform"
                  @focus="onCurveFocus"
              ></ui-curve-editor>
          </div>

          <div v-show="!curveVisible">
              <PreviewRow
                  v-for="(item, index) in curves"
                  :key="String(index) + '__' + item.displayName"
                  :name="item.displayName"
                  :hidden="false"
                  :key-frames="item.keyframes"
                  :list-index="index"
                  :update-position="$root.updatePosition"
                  :update-frame="$root.updateKeyFrame"
                  :update-select="$root.updateSelectKey"
                  :lock="false"
                  :offset="offset"
                  :select-info="selectedKeyInfo"
                  :scroll="scrollInfo"
                  :param="[]"
                  @select-key="updateSelectKey"
                  @remove-key="onKeyRemove"
                  @paste-key="onKeyPaste"
                  @create-key="onKeyCreate"
              ></PreviewRow>
          </div>
      </div>
  </div>
`;

function useFrameDump() {
  const r = useAuxCurveStore();
  const a = ref(-1);

  const s = computed({
    get: () => r.selectedFrameDump,
    set: (e) => {
      r.selectedFrameDump = e;
    },
  });

  var e = computed(() => s.value != null);
  const t = () => {
    s.value = null;
  };
  return {
    renderDump: s,
    isEditable: e,
    update: async (e, r, u) => {
      var o;

      if (r === "" || e === "") {
        t();
      } else {
        o = Date.now();
        a.value = o;
        e = await getAuxCurveValueAtFrame(e, r, u);

        a.value === o &&
          (isPlainObject(e)
            ? (s.value = { ...e, displayName: "Value" })
            : (s.value = e));
      }
    },
    reset: t,
  };
}
exports.AuxiliaryCurveFrames = defineComponent({
  name: "AuxiliaryCurveFrames",
  components: { PreviewRow: preview_row_aux_1.PreviewRowAux },
  directives: { propDump: directives_1.UiPropDump },
  props: {
    offset: { type: Number, default: 0 },
    currentFrame: { type: Number, default: 0 },
  },
  setup(r, e) {
    const u = useBaseStore();
    const o = useAuxCurveStore();
    var a = ref({});
    var s = ref();
    const t = computed(() => u.currentClip);
    var i = useElementSize(s);
    const { visible, show, hide, onTransform, getExposedAPI, onBlur, onFocus } =
      useAuxCurveEditor({ currentClip: t, size: i });
    i = computed(() => o.curves);
    const _ = toRef(o, "selectedCurveName");
    var f = toRef(o, "selectKeyInfo");

    var y = computed(() => o.curveNameMap);

    const { isEditable, renderDump, update } = useFrameDump();

    watch(t, () => {
      o.reset();
    });

    watch(
      () => [unref(t), _.value, r.currentFrame],
      async ([e, r, u], o, a) => {
        update(e, r, u);
      }
    );

    watch(
      () => o.selectedFrameDumpRenderKey,
      () => {
        update(unref(t), _.value, r.currentFrame);
      }
    );

    const C = (e, r) => {
      _.value = e;
      o.selectKeyInfo = r;
    };
    const F = getExposedAPI();
    return {
      framesArea: s,
      curveVisible: visible,
      showCurve: show,
      hideCurve: hide,
      scrollInfo: a,
      curves: i,
      selectedKeyInfo: f,
      keyframeMap: y,
      renderDump: renderDump,
      isPropEditable: isEditable,
      onFrameValueChange: (e) => {
        var e = e.target?.dump?.value;

        if (isEditable.value && Number.isFinite(e)) {
          e = { newValue: e };
          IApplyOperation(createAuxKey(unref(t), _.value, r.currentFrame, e), {
            recordUndo: false,
          });
        }
      },
      onFrameValueConfirm: (e) => {
        var e = e.target?.dump?.value;

        if (isEditable.value && Number.isFinite(e)) {
          e = { newValue: e };
          IApplyOperation(createAuxKey(unref(t), _.value, r.currentFrame, e));
        }
      },
      updateSelectKey: C,
      onKeyRemove: (e, r) => {
        if (e === _.value) {
          update(unref(t), _.value, r);
        }
      },
      onKeyPaste: (e, r) => {
        if (e === _.value) {
          update(unref(t), _.value, r);
        }
      },
      onKeyCreate: (e, r) => {
        if (e === _.value) {
          update(unref(t), _.value, r);
        }
      },
      onCurveBlur: onBlur,
      onCurveFocus: onFocus,
      onHeaderMousedown: (e) => {
        animation_editor_1.animationEditor.onStartResize(e, "auxCurve");
      },
      onCurveAreaMousedown: (e) => {
        if (!visible.value) {
          C("", null);
        }
      },
      onTransform: onTransform,
      ...getExposedAPI(),
      zoomToFit: () => {
        if (visible.value) {
          F.zoomToFit();
        }
      },
      zoomToSelectedKeys: () => {
        if (visible.value) {
          F.zoomToSelectedKeys();
        }
      },
    };
  },
  template,
});
