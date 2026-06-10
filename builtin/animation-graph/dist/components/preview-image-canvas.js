function data() {
  return { isDirty: false };
}
async function mounted() {
  this.init();
}
async function destroyed() {
  cancelAnimationFrame(this.animationId);
  this.close();
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = undefined;
exports.watch = undefined;
exports.props = undefined;
exports.template = undefined;
exports.data = data;
exports.mounted = mounted;
exports.destroyed = destroyed;

exports.template = `
<ui-drag-area class="image" droppable="cc.Asset"
    @drop="drop($event)"
>
    <canvas class="canvas" ref="canvas"
        @mousedown="mousedown($event)"
        @wheel="mousewheel($event)"
    ></canvas>
    <div class="drag-tip"
        :active="state===$root.queryData.previewState.NO_MODEL"
    >
        <ui-label value="i18n:animation-graph.preview.NO_MODEL"></ui-label>
    </div>
</ui-drag-area>
`;

exports.props = ["config", "play", "state"];

exports.watch = {
  state() {
    var e;
    var t;
    var i = this;

    if (
      i.state !== i.$root.queryData.previewState.NO_ERROR &&
      ((e = (t = i.$refs.canvas).clientWidth), (t = t.clientHeight), e) &&
      t
    ) {
      i.glPreview.drawGL({
        buffer: new Uint8Array(e * t * 4),
        width: e,
        height: t,
      });
    }
  },
};

exports.methods = {
  async init() {
    const e = this;
    var t = Editor._Module.require("PreviewExtends").default;
    e.glPreview = new t(e.config.GLPreview.name, e.config.GLPreview.method);

    await e.glPreview.init({
      width: e.$el.clientWidth,
      height: e.$el.clientHeight,
    });

    e.resizeObserver = new window.ResizeObserver(() => {
      e.isDirty = true;
    });

    e.resizeObserver.observe(e.$el);
    e.refresh();
  },
  close() {
    var e = this;

    if (e.resizeObserver) {
      e.resizeObserver.unobserve(e.$el);
    }
  },
  async callPreviewFunction(e, ...t) {
    return Editor.Message.request(
      "scene",
      "call-preview-function",
      this.config.GLPreview.name,
      e,
      ...t
    );
  },
  async refresh() {
    const e = this;
    if (e.isDirty) {
      e.isDirty = false;
      try {
        var t = e.$refs.canvas;
        var e_$el = e.$el;

        var { clientWidth, clientHeight } = e_$el;

        if (t.width !== clientWidth || t.height !== clientHeight) {
          t.width = clientWidth;
          t.height = clientHeight;
          await e.glPreview.initGL(t, {
            width: clientWidth,
            height: clientHeight,
          });
          await e.glPreview.resizeGL(clientWidth, clientHeight);
        }

        var s = await e.glPreview.queryPreviewData({
          width: t.width,
          height: t.height,
        });

        e.glPreview.drawGL(s);
      } catch (e) {
        console.warn(e);
      }
    }
    cancelAnimationFrame(e.animationId);

    e.animationId = requestAnimationFrame(() => {
      e.refresh();
    });
  },
  drop() {
    const i = [];
    var { additional, value } =
      JSON.parse(
        JSON.stringify(Editor.UI.__protected__.DragArea.currentDragInfo)
      ) || {};

    if (additional) {
      additional.forEach((t) => {
        if (t.type === "cc.Prefab") {
          i.push(t.value);
        }

        if (Array.isArray(t.extends)) {
          t.extends.forEach((e) => {
            if (e === "cc.Prefab") {
              i.push(t.value);
            }
          });
        }

        if (t.subAssets) {
          Object.values(t.subAssets).forEach((e) => {
            if (e.type === "cc.Prefab") {
              i.push(e.value);
            }
          });
        }
      });
    }

    if (value && !i.includes(value)) {
      i.push(value);
    }

    if (i.length) {
      this.$parent.setModel(i[0]);
    }
  },
  async mousedown(e) {
    const i = this;
    async function r(e) {
      await i.callPreviewFunction("onMouseMove", {
        movementX: e.movementX,
        movementY: e.movementY,
      });

      i.isDirty = true;
    }

    await i.callPreviewFunction("onMouseDown", {
      x: e.x,
      y: e.y,
      button: e.button,
    });

    document.addEventListener("mousemove", r);

    document.addEventListener("mouseup", async function e(t) {
      await i.callPreviewFunction("onMouseUp", { x: t.x, y: t.y });
      document.removeEventListener("mousemove", r);
      document.removeEventListener("mouseup", e);
      i.isDirty = false;
    });

    i.isDirty = true;
  },
  async mousewheel(e) {
    await this.callPreviewFunction("onMouseWheel", {
      wheelDeltaY: 0 - e.deltaY,
      wheelDeltaX: 0 - e.deltaX,
    });

    this.isDirty = true;
  },
};
