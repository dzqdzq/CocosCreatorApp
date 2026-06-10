Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.computed = undefined;
exports.watch = undefined;
exports.props = undefined;
exports.template = undefined;

exports.data = data;
exports.mounted = mounted;
exports.destroyed = destroyed;
const Config = { pointerRadius: 5 };
function data() {
  return {
    pointers: [],
    threshold: { x: 0, y: 0, left: 0, top: 0 },
    X: { min: 0, max: 0, total: 0, dialPx: 0 },
    Y: { min: 0, max: 0, total: 0, dialPx: 0 },
  };
}
function mounted() {
  this.init();
}
async function destroyed() {
  this.close();
}

exports.template = `
<div class="handle-2d">
    <div class="pointers" ref="pointers"
        @mousemove="mouseMoveThreshold($event)"
    >

        <div class="pointer"
            v-for="(pointer, pointerIndex) in pointers" 
            :key="'preview-play-handle-2d-pointer-' + pointerIndex"
            :style="{left: pointer.left+'px', top: pointer.top+'px', '--weight':pointer.weight }"
            @mousedown.stop="mouseDownPointer($event, pointer, pointerIndex)"
        ></div>
        <div class="threshold"
            :style="thresholdStyle"
        ></div>
    </div>
    <div class="threshold-text">{{threshold.x.toFixed(3)}}, {{threshold.y.toFixed(3)}}</div>
    <div class="threshold-tip">
        <ui-label class="text" value="i18n:animation-graph.motion.blend2DPreviewTip"></ui-label>
        <span class="point"></span>
    </div>
    
    <ui-num-input class="threshold-y threshold-input" label="Y" step="0.1"
        :value="Y.radius"
        @confirm="changeRadius($event, 'Y')"
    ></ui-num-input>

    <ui-num-input class="threshold-x threshold-input" label="X" step="0.1"
        :value="X.radius"
        @confirm="changeRadius($event, 'X')"
    ></ui-num-input>
</div>
`;

exports.props = [];

exports.watch = {
  "$root.queryData.view.motion"() {
    this.refresh();
  },
};

exports.computed = {
  motion() {
    return this.$root.viewMotion();
  },
  thresholdStyle() {
    var e = this;
    let t = "hidden";

    if (
      e.Y.radius >= Math.abs(e.threshold.y) &&
      e.X.radius >= Math.abs(e.threshold.x)
    ) {
      t = "initial";
    }

    return {
      left: e.threshold.left + "px",
      top: e.threshold.top + "px",
      visibility: t,
    };
  },
};

exports.methods = {
  init() {
    const e = this;
    e.initEnv();
    e.initThreshold();

    e.resizeObserver = new window.ResizeObserver(() => {
      e.refresh();
    });

    e.resizeObserver.observe(e.$el);
  },
  initEnv() {
    var e = this;
    var { clientWidth, clientHeight } = e.$refs.pointers;
    var i = e.motion.min[0];
    var s = e.motion.max[0];
    let n = Math.max(Math.abs(i), Math.abs(s));

    i =
      2 *
      (n =
        (n = e.motion.editorData.threshold
          ? e.motion.editorData.threshold.radiusX
          : n) || 1.5);

    e.X = { min: 0 - n, max: n, radius: n, total: i, dialPx: clientWidth / i };
    s = e.motion.min[1];
    clientWidth = e.motion.max[1];
    let r = Math.max(Math.abs(s), Math.abs(clientWidth));
    i =
      2 *
      (r =
        (r = e.motion.editorData.threshold
          ? e.motion.editorData.threshold.radiusY
          : r) || 1.5);
    e.Y = { min: 0 - r, max: r, radius: r, total: i, dialPx: clientHeight / i };
  },
  initThreshold() {
    var e = this;
    var t = e.X.total / 2 + e.X.min;
    var o = e.Y.total / 2 + e.Y.min;
    e.threshold.x = t;
    e.threshold.y = o;
  },
  close() {
    var e = this;

    if (e.resizeObserver) {
      e.resizeObserver.unobserve(e.$el);
    }
  },
  refresh() {
    const t = this;
    const o = [];
    t.initEnv();

    t.motion.children.forEach((e) => {
      e = t.getPointerPosition(e.threshold);
      o.push(e);
    });

    var e = t.getPointerPosition({ x: t.threshold.x, y: t.threshold.y });
    t.threshold.left = e.left;
    t.threshold.top = e.top;
    t.pointers = o;
    t.refreshWeight();
  },
  async refreshWeight() {
    const o = this;
    var e = await o.$parent.queryBlend2DThresholdsWeights({
      x: o.threshold.x,
      y: o.threshold.y,
    });

    if (Array.isArray(e)) {
      e.forEach((e, t) => {
        o.$set(o.pointers[t], "weight", e);
      });
    }
  },
  getPointerPosition(e) {
    var t = this;
    return {
      left: (e.x - t.X.min) * t.X.dialPx - Config.pointerRadius,
      top: (t.Y.max - e.y) * t.Y.dialPx - Config.pointerRadius,
    };
  },
  getPointerThreshold(e) {
    var t = this;
    var o = (e.left + Config.pointerRadius) / t.X.dialPx + t.X.min;
    var e = t.Y.max - (e.top + Config.pointerRadius) / t.Y.dialPx;
    return {
      x: Math.min(t.X.max, Math.max(t.X.min, o)),
      y: Math.min(t.Y.max, Math.max(t.Y.min, e)),
    };
  },
  mouseDownPointer(e, a, h) {
    const d = this;
    const l = 0 - Config.pointerRadius;
    const u = d.$refs.pointers.clientWidth - Config.pointerRadius;
    const p = 0 - Config.pointerRadius;
    const m = d.$refs.pointers.clientHeight - Config.pointerRadius;
    function clientX(o) {
      if (d.mouseDownPoint) {
        o.stopPropagation();
        o.preventDefault();
        var { clientX, clientY, left, top } = d.mouseDownPoint;
        var clientX = o.clientX - clientX;
        var o = o.clientY - clientY;
        if (clientX != 0 || o != 0) {
          d.mouseDownPoint.hasMoved = true;
          let e = left + clientX;

          if (e < l) {
            e = l;
          } else if (e > u) {
            e = u;
          }

          let t = top + o;

          if (t < p) {
            t = p;
          } else if (t > m) {
            t = m;
          }

          clientY = { left: e, top: t };
          left = (Object.assign(a, clientY), d.getPointerThreshold(clientY));
          Object.assign(d.motion.children[h].threshold, left);
        }
      }
    }

    d.mouseDownPoint = {
      hasMoved: false,
      clientX: e.clientX,
      clientY: e.clientY,
      pointerIndex: h,
      ...a,
    };

    document.addEventListener("mousemove", i);

    document.addEventListener("mouseup", function e() {
      var t;
      var o;

      if (d.mouseDownPoint.hasMoved) {
        t = d.mouseDownPoint.pointerIndex;
        o = d.motion.children[t].threshold;

        d.$root.changeMotionThreshold2D(
          d.$root.queryData.view.motionLevel,
          t,
          o
        );
      }

      document.removeEventListener("mousemove", i);
      document.removeEventListener("mouseup", e);
      d.mouseDownPoint = null;
    });
  },
  mouseMoveThreshold(e) {
    var t;
    var o = this;
    var e_currentTarget = e.currentTarget;

    if (e.ctrlKey) {
      e_currentTarget.setAttribute("ctrl", "");

      o.mouseDownPoint ||
        ((e = {
          left: e.offsetX - Config.pointerRadius,
          top: e.offsetY - Config.pointerRadius,
        }),
        (t = o.getPointerThreshold(e)),
        Object.assign(o.threshold, e, t),
        o.$parent.updatePreviewBlendVariable([
          { name: o.motion.value[0].variable, value: o.threshold.x },
          { name: o.motion.value[1].variable, value: o.threshold.y },
        ]),
        o.refreshWeight());
    } else {
      e_currentTarget.removeAttribute("ctrl");
    }
  },
  changeRadius(e, t) {
    e = e.target;

    if (e) {
      this[t].radius = e.value;

      this.$parent.updateMotionEditDataThreshold({
        radiusX: this.X.radius,
        radiusY: this.Y.radius,
      });
    }
  },
};
