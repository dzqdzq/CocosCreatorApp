Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.watch = undefined;
exports.computed = undefined;
exports.components = undefined;
exports.template = undefined;

exports.data = data;
exports.mounted = mounted;
exports.destroyed = destroyed;

const { isValidAnimationClipForGraph } = require("../clip-related/validation");

const defaultType = "state";
function data() {
  return {
    clipAssetType: "cc.AnimationClip",
    graphData: {},
    graph: {
      scale: 1,
      top: 0,
      left: 0,
      centerX: 0,
      centerY: 0,
      type: defaultType,
    },
    minScale: 0.05,
    maxScale: 2,
    mouseDownPoint: null,
  };
}
function mounted() {
  const e = this;

  e.observer = new window.ResizeObserver(() => {
    e.resize();
  });

  e.observer.observe(e.$el);
  e.resize();
}
function destroyed() {
  if (this.observer) {
    this.observer.unobserve(this.$el);
  }
}

exports.template = `
    <ui-drag-area class="layer"
        :droppable="clipAssetType"
        @mousedown="mouseDown($event)"
        @wheel="wheel($event)"
        @drop="drop($event)"
    >
        <grid class="grid" ref="grid"></grid>
        <transition name="component-fade" mode="out-in"
            v-on:before-enter="beforeEnter"
            v-on:before-leave="beforeLeave"
        >
            <component class="graph" ref="component"
                :is="graph.type"
                :type="graph.type"
                :style="graphStyle"
                :graph="graphData"
            ></component>
        </transition>
    </ui-drag-area>
`;

exports.components = {
  grid: require("./grid"),
  state: require("./state"),
  motion: require("./motion"),
  pose: require("./pose"),
};

exports.computed = {
  graphStyle() {
    var e = this;
    return {
      top: Math.ceil(e.graph.top) + "px",
      left: Math.ceil(e.graph.left) + "px",
      transform: `scale(${e.graph.scale})`,
    };
  },
};

exports.watch = {
  "graph.scale"() {
    this.moveViewport();
  },
  "graph.top"() {
    this.moveViewport();
  },
  "graph.left"() {
    this.moveViewport();
  },
  "graph.centerX"() {
    if (this.$refs.component) {
      this.$refs.component.resize();
    }
  },
  "graph.centerY"() {
    if (this.$refs.component) {
      this.$refs.component.resize();
    }
  },
};

exports.methods = {
  beforeEnter() {
    this.$refs.grid.$el.classList.remove("animationOut");
    this.$refs.grid.$el.classList.add("animationIn");
  },
  beforeLeave() {
    this.$refs.grid.$el.classList.remove("animationIn");
    this.$refs.grid.$el.classList.add("animationOut");
  },
  async refresh(e, t) {
    var r = this;
    r.graph.type = e;
    await r.refreshViewport(t);
    r.graphData = t;
  },
  resize() {
    var e = this;
    e.graph.centerX = e.$el.offsetWidth / 2;
    e.graph.centerY = e.$el.offsetHeight / 2;
  },
  clear() {
    var e = this;
    e.graph.type = defaultType;
    e.graphData = {};
    e.viewport();
  },
  viewport() {
    var e = this;
    e.graph.scale = 1;
    e.graph.top = 0;
    e.graph.left = 0;
  },
  async bestViewport() {
    var e = this;
    var t = e.$el.clientWidth;
    var r = e.$el.clientHeight;
    var o = e.calcComponentRect();
    var i = t / o.width;
    var a = r / o.height;
    var i = 0.95 * (Math.min(i, a, 1) || 1);
    e.graph.scale = i;
    e.graph.left = (t - o.width * i) / 2 - o.minX * i - (t * (1 - i)) / 2;
    e.graph.top = (r - o.height * i) / 2 - o.minY * i - (r * (1 - i)) / 2;
    e.saveViewport();
  },
  moveViewport() {
    const e = this;
    window.cancelAnimationFrame(e.viewportAnimationId);

    e.viewportAnimationId = window.requestAnimationFrame(() => {
      e.saveViewport();
    });
  },
  getViewportKey(e) {
    var t = this;
    var r = ["viewport"];

    if (t.$root.queryData.assetInfo) {
      r.push(t.$root.queryData.assetInfo.uuid);
    }

    if ((e = e || t.graphData).editorData?.id) {
      r.push(e.editorData.id);
    } else {
      const o = [];

      t.$root.queryData.view.crumbs.slice(0, -1).forEach((e) => {
        if (e.type) {
          o.push(e.type + "-" + e.value);
        }
      });

      r.push(o.join("-"));
    }

    return r.join(".");
  },
  async refreshViewport(e) {
    var t = this;
    try {
      var r = await Editor.Profile.getTemp(
        "animation-graph",
        t.getViewportKey(e)
      );

      if (r) {
        Object.assign(t.graph, r);
      } else {
        t.viewport();
      }
    } catch (e) {
      console.error("animation-graph get local viewport data error: " + e);
    }
  },
  async saveViewport() {
    var e = this;
    await Editor.Profile.setTemp("animation-graph", e.getViewportKey(), {
      scale: e.graph.scale,
      top: e.graph.top,
      left: e.graph.left,
    });
  },
  select(e) {
    this.$refs.component.select(e);
  },
  wheel(e) {
    var t;
    var r;
    var o;
    var i;
    var a;
    var n = this;
    e.stopPropagation();
    e.preventDefault();

    if (n.$refs.component) {
      o = n.$refs.component.$el.getBoundingClientRect();
      i = n.graph.scale;
      t = 0 - (e.deltaX || e.deltaY) / 5000 /* 5e3 */;
      r = 0 - ((e.clientY - (o.y + o.height / 2)) * t) / i;
      e = 0 - ((e.clientX - (o.x + o.width / 2)) * t) / i;
      o = i;
      i = n.graph.top;
      a = n.graph.left;

      (o += t) < n.minScale ||
        o > n.maxScale ||
        ((i += r),
        (a += e),
        (n.graph.scale = o),
        (n.graph.top = i),
        (n.graph.left = a));
    }
  },
  mouseDown(e) {
    const s = this;
    var t;
    var r;
    var o;
    function i(e) {
      var t;
      var r;
      var o;
      var i;
      var a;
      var n;

      if (s.mouseDownPoint && s.mouseDownPoint.button === "right") {
        e.stopPropagation();
        e.preventDefault();

        ({
          clientX: n,
          clientY: t,
          gridStartX: r,
          gridStartY: o,
          graphLeft: i,
          graphTop: a,
        } = s.mouseDownPoint);

        n = e.clientX - n;
        e = e.clientY - t;

        (n == 0 && e == 0) ||
          ((s.mouseDownPoint.hasMoved = true),
          (s.$refs.grid.startX = r + n),
          (s.$refs.grid.startY = o + e),
          s.$refs.grid.render(),
          (s.graph.left = i + n),
          (s.graph.top = a + e));
      }
    }

    if (s.$refs.component) {
      o = s.$el.getBoundingClientRect();
      t = s.$refs.component.$el.getBoundingClientRect();
      r = o.width + (e.clientX - t.x - t.width) / s.graph.scale;
      o = o.height + (e.clientY - t.y - t.height) / s.graph.scale;

      s.mouseDownPoint = {
        hasMoved: false,
        clientX: e.clientX,
        clientY: e.clientY,
        offsetX: r,
        offsetY: o,
        button: e.button === 0 ? "left" : "right",
        gridStartX: s.$refs.grid.startX,
        gridStartY: s.$refs.grid.startY,
        graphLeft: s.graph.left,
        graphTop: s.graph.top,
      };

      document.addEventListener("mousemove", i);

      document.addEventListener("mouseup", function e(t) {
        if (
          s.mouseDownPoint &&
          s.mouseDownPoint.button === "right" &&
          !s.mouseDownPoint.hasMoved
        ) {
          s.contextMenu(s.mouseDownPoint);
        }

        document.removeEventListener("mousemove", i);
        document.removeEventListener("mouseup", e);
        s.mouseDownPoint = null;
      });
    }
  },
  contextMenu(e) {
    this.$refs.component.contextMenu(e);
  },
  drop(r) {
    const o = this;
    o.$el.click();
    const i = [];
    var e = (
      JSON.parse(
        JSON.stringify(Editor.UI.__protected__.DragArea.currentDragInfo)
      ) || {}
    ).additional;

    if (e) {
      e.forEach((t) => {
        if (Array.isArray(t.extends)) {
          t.extends.forEach((e) => {
            if (
              e === o.clipAssetType &&
              isValidAnimationClipForGraph(t.value)
            ) {
              i.push(t.value);
            }
          });
        }

        if (t.subAssets) {
          Object.values(t.subAssets).forEach((e) => {
            if (
              e.type === o.clipAssetType &&
              isValidAnimationClipForGraph(e.value)
            ) {
              i.push(e.value);
            }
          });
        }

        if (t.type === o.clipAssetType) {
          if (isValidAnimationClipForGraph(t.value)) {
            i.push(t.value);
          } else {
            console.warn(
              `${Editor.I18n.t(
                "animation-graph.motion.invalidCipInfo"
              )} {asset(${t.value})}`
            );
          }
        }
      });
    }

    if (i.length && o.$refs.component) {
      var e = o.$el.getBoundingClientRect();
      var a = o.$refs.component.$el.getBoundingClientRect();
      var n = e.width + (r.clientX - a.x - a.width) / o.graph.scale;
      let t = e.height + (r.clientY - a.y - a.height) / o.graph.scale - 48;
      var i_length = i.length;
      for (let e = 0; e < i_length; e++) {
        var p = i[e];
        t += 32;
        o.$refs.component.drop(r, { offsetX: n, offsetY: t, uuid: p });
      }
    }
  },
  twinkle(e, t, r) {
    if (this.$refs.component && this.$refs.component.$attrs.type === e) {
      this.$refs.component.$refs[t][0].twinkle = r;
    }
  },
  getCenterXY(e, t = true) {
    let r = e.left - this.graph.centerX;
    let o = e.top - this.graph.centerY;

    if (t) {
      r += e.width / 2;
      o += e.height / 2;
    }

    return { centerX: r, centerY: o };
  },
  getPosition(e, t = true) {
    let r = e.centerX + this.graph.centerX;
    let o = e.centerY + this.graph.centerY;

    if (t) {
      r -= e.width / 2;
      o -= e.height / 2;
    }

    return { top: o, left: r };
  },
  calcComponentRect() {
    var e = this.$refs.component.nodes;
    var t = [];
    var r = [];
    var o = {};
    var i = {};
    for (const m in e) {
      var a = e[m];

      if (
        a.width !== 0 &&
        a.height !== 0 &&
        (t.push(a.left),
        r.push(a.top),
        (o[a.left] === undefined || o[a.left] < a.width) &&
          (o[a.left] = a.width),
        i[a.top] === undefined || i[a.top] < a.height)
      ) {
        i[a.top] = a.height;
      }
    }
    var n = Math.min(...t);
    var s = Math.max(...t);
    var p = Math.min(...r);
    var h = Math.max(...r);
    var l = Math.abs(s - n) + o[s];
    var c = Math.abs(h - p) + i[h];
    var g = s + o[s];
    var d = h + i[h];
    return {
      minX: n,
      maxX: s,
      minY: p,
      maxY: h,
      centerX: (n + g) / 2,
      centerY: (p + d) / 2,
      left: n,
      right: g,
      top: p,
      bottom: d,
      width: l,
      height: c,
    };
  },
};
