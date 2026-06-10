var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

exports.listeners = undefined;
exports.methods = undefined;
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;

exports.ready = ready;
exports.close = close;

const { readFileSync } = require("fs");

const { join } = require("path");

const curve_control_1 = __importDefault(require("./curve-control"));
const grid_1 = __importDefault(require("./grid"));
const { drawHermite, DEFAULT_KEYFRAMES } = require("./utils");
const Vue = require("vue/dist/vue.js");
Vue.config.productionTip = false;
Vue.config.devtools = false;
let panel = null;
let vm = null;
const AXIS_MARGIN = 40;

const vueTemplate = readFileSync(
  join(__dirname, "../../static", "/template/curve-editor.html"),
  "utf8"
);

const InspectorCurveEditorVM = Vue.extend({
  name: "InspectorCurveEditorVM",
  data() {
    return {
      scale: 1,
      showPresets: false,
      showMulti: false,
      grid: null,
      curveControl: null,
      currentPoint: null,
      mainCtx: null,
      gridCtx: null,
      ctrlCxt: null,
      dump: {
        key: "",
        name: "",
        keyFrames: DEFAULT_KEYFRAMES[0],
        negative: false,
        radian: false,
        multiplier: 1,
      },
      axis: { piece: 10, rangeX: 1, rangeY: 1 },
      ctrlConfig: {
        fillColor: "red",
        strokeStyle: "white",
        radius: 2,
        lineWidth: 1,
        handlerSize: 40,
        focusColor: "rgba(245, 240, 32, 0.44)",
      },
      curveConfig: { strokeStyle: "red", lineWidth: 0.1 },
      defaultKeyFrames: DEFAULT_KEYFRAMES,
      toolCanvas: [],
      isReady: false,
      toolCanvasSize: { w: 30, h: 30 },
    };
  },
  computed: {
    multiplier() {
      return this.dump.multiplier
        ? this.dump.radian
          ? Number(((180 * this.dump.multiplier) / Math.PI).toFixed(2))
          : this.dump.multiplier
        : 1;
    },
  },
  async mounted() {
    this.init();
  },
  methods: {
    T(e) {
      return Editor.I18n.t(e);
    },
    updateToolCanvasSize() {
      if (this.mainCtx) {
        this.toolCanvasSize = {
          w: this.mainCtx.canvas.width / 10,
          h: this.mainCtx.canvas.height / 5,
        };
      }
    },
    rePaint() {
      this.initCanvas();
      this.curveControl.rePaint();
      this.drawThumb(this.$refs.tools, this.defaultKeyFrames);
    },
    init() {
      if (panel.clientWidth && panel.clientHeight) {
        this.initCanvas();
        this.drawGrid();
        this.drawCurve();
        this.isReady = true;
      }
    },
    onMulti(e) {
      let t = e.target.value;

      if (e.target.value !== 0) {
        this.grid.multiplier = t;
        this.dump.radian && (t = (t / 180) * Math.PI);
        this.dump.multiplier = t;
        Editor.Message.send("inspector", "curve-change", this.dump);
      }
    },
    onTools(e) {
      e = e.target.getAttribute("index");

      if (e) {
        this.dump.keyFrames = this.defaultKeyFrames[e];
        this.curveControl.update(this.dump.keyFrames, this.dump.negative);
        Editor.Message.send("inspector", "curve-change", this.dump);
      }
    },
    onShowPresets(e) {
      this.showPresets = true;
      var {} = e.target;
      this.drawThumb(this.$refs.presets, this.defaultKeyFrames);
    },
    checkAndUpdate(e) {
      if (e) {
        (!Array.isArray(e.value.keyFrames) || e.value.keyFrames.length < 1) &&
          ((e = e || {}).keyFrames = DEFAULT_KEYFRAMES[0]);

        this.dump = e.value;
        this.dump.key = e.key;
        this.dump.name = e.name;
        this.dump.negative = e.negative;
        this.dump.radian = e.radian;

        typeof e.multiplier != "number"
          ? (this.dump.multiplier = 1)
          : ((this.dump.multiplier = e.multiplier), (this.showMulti = true));

        this.grid.multiplier = this.multiplier;
        this.curveControl.update(this.dump.keyFrames, e.negative);
        this.drawThumb(this.$refs.tools, this.defaultKeyFrames);
      }
    },
    drawThumb(s, r) {
      r.map((e, t) => {
        let i;

        if (this.toolCanvas.length !== r.length) {
          (i = document.createElement("canvas")).setAttribute(
            "index",
            String(t)
          );

          s.append(i);
          this.toolCanvas.push(i);
        } else {
          i = this.toolCanvas[t];
        }

        this.resizeCanvas([i], this.toolCanvasSize);
        t = i.getContext("2d");
        t.strokeStyle = "white";
        drawHermite(e, t, this.dump.negative);
      });
    },
    initCanvas() {
      var e = this.$refs.gridCanvas;
      var t = this.$refs.mainCanvas;
      var i = this.$refs.controlCanvas;

      if (e && t && i) {
        this.gridCtx = e.getContext("2d");
        this.mainCtx = t.getContext("2d");
        this.ctrlCxt = i.getContext("2d");

        this.resizeCanvas(
          [this.gridCtx.canvas, this.mainCtx.canvas, this.ctrlCxt.canvas],
          { w: panel.clientWidth, h: 0.8 * panel.clientHeight - 40 }
        );

        this.updateToolCanvasSize();
      }
    },
    resizeCanvas(e, t) {
      for (const i of e) {
        i.width = t.w;
        i.height = t.h;
      }
    },
    drawCurve() {
      this.curveControl = new curve_control_1.default({
        context: this.ctrlCxt,
        mainCtx: this.mainCtx,
        grid: this.grid,
        ctrlConfig: this.ctrlConfig,
        curveConfig: this.curveConfig,
      });

      this.curveControl.on("change", (e) => {
        this.dump.keyFrames = e.keyFrames;
        Editor.Message.send("inspector", "curve-change", this.dump);
      });
    },
    onWrapMode(e) {
      var e = e.target;
      var t = e.getAttribute("name");

      if (t) {
        this.dump[t] = parseInt(e.value);
        Editor.Message.send("inspector", "curve-change", this.dump);
      }
    },
    drawGrid() {
      var e = {
        context: this.gridCtx,
        axisMargin: AXIS_MARGIN,
        lineWidth: 1,
        axis: this.axis,
        multiplier: this.multiplier,
      };
      this.grid = new grid_1.default(e);
      this.grid.draw();
    },
    onMouseWheel(e) {
      e.stopPropagation();
      e = e.wheelDelta;
      e = (this.scale / 100) * 2 ** (0.002 * e);
      this.scale = Math.ceil(100 * e);
    },
  },
  template: vueTemplate,
});

function ready(e) {
  panel = this;
  vm?.$destroy();
  (vm = new InspectorCurveEditorVM()).$mount(panel.$.container);
  Editor.Message.send("inspector", "curve-state", true);

  if (localStorage.getItem("curve-dump") && e) {
    e.name += "(disconnect)";
    vm.checkAndUpdate(e);
  }
}
function close() {
  Editor.Message.send("inspector", "curve-state", false);
  vm?.$destroy();
  vm = null;
  panel = null;
}

exports.style = readFileSync(join(__dirname, "../index.css"), "utf8");

exports.template = '<div class="container"></div>';
exports.$ = { container: ".container" };

exports.methods = {
  currentKeys(e) {
    if (vm && (vm.isReady || vm.init(), vm.isReady)) {
      vm.checkAndUpdate(e);
      localStorage.setItem("curve-dump", e);
    }
  },
};

exports.listeners = {
  resize() {
    if (vm && (vm.isReady || vm.init(), vm.isReady)) {
      vm.rePaint();
    }
  },
  show() {
    if (vm && !vm.isReady) {
      vm.init();
    }
  },
};
