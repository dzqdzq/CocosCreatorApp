Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyCurve = undefined;

const { defineComponent } = require("vue/dist/vue.js");

const { useTransformEvent } = require("../hooks/store-grid");

const { useCurveEditor } = require("../hooks/use-curve-editor");

const { useGridScrollSync } = require("../hooks/use-grid-scroll");

const directives_1 = require("../directives");

const { adaptDirectives } = directives_1;

const template = `
  <div class="curve-editor">
      <ui-curve-editor
          ref="editor"
          class="tw-w-full tw-h-full curve-editor__editor"
          tabindex="0"
          @transform="onTransform"
          @focus="onCurveFocus"
      ></ui-curve-editor>

      <ui-grid-scrollbar
          v-set:scale="xScale"
          v-set:offset="xOffset"
          class="curve-editor__horizontal"
          @change="onXChange"
      ></ui-grid-scrollbar>

      <ui-grid-scrollbar
          v-set:scale="yScale"
          v-set:offset="yOffset"
          vertical
          class="curve-editor__vertical"
          @change="onYChange"
      ></ui-grid-scrollbar>
  </div>
`;

exports.PropertyCurve = defineComponent({
  name: "PropertiesCurve",
  components: {},
  directives: adaptDirectives({ set: directives_1.PropSet }),
  props: {},
  emits: {},
  setup(e, r) {
    const o = useCurveEditor({
      uniqueName: "curve",
      configure() {},
    });
    var o_curveEditor = o.curveEditor;
    const t = useTransformEvent();
    const {
      xOffset,
      xScale,
      yOffset,
      yScale,
      onXChange,
      onTransform,
      onYChange,
      updateScrollFromCurve,
    } = useGridScrollSync({
      curveElement: o_curveEditor,
      emitGlobalTransform: () => t.emitUpdate("property"),
    });
    return {
      ...{
        ...o.getExposedAPI(),
        paint: (e) => {
          o.paint(e);
          updateScrollFromCurve();
        },
      },
      xOffset: xOffset,
      xScale: xScale,
      yOffset: yOffset,
      yScale: yScale,
      onXChange: onXChange,
      onYChange: onYChange,
      onTransform: onTransform,
      onCurveBlur: o.onBlur,
      onCurveFocus: o.onFocus,
    };
  },
  template,
});
