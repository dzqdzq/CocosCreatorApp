function data() {
  return {};
}
function mounted() {
  this.resize();
}
Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.watch = undefined;
exports.computed = undefined;
exports.components = undefined;
exports.props = undefined;
exports.template = undefined;

exports.data = data;
exports.mounted = mounted;

exports.template = `
    <div class="state"
        :style="style"
        @mousedown="mouseDown($event)"
        @dragenter="dragEnter($event)"
        @dragleave="dragLeave($event)"
        @drop="drop($event)"
    >
        <ui-label ref="name" class="name"
            :value="dump.name"
        ></ui-label>
        <motion-prop
            :dump=dump
        ></motion-prop>
    </div>
`;

exports.props = ["dump"];
exports.components = { "motion-prop": require("./motion-prop") };

exports.computed = {
  style() {
    return { top: this.dump.top + "px", left: this.dump.left + "px" };
  },
};

exports.watch = {
  dump() {
    this.resize();
  },
};

exports.methods = {
  resize() {
    const t = this;
    window.requestAnimationFrame(() => {
      t.setPosition();
    });
  },
  mouseDown(t) {
    const a = this;
    function o(t) {
      var e;
      var o;
      var n;
      var i;

      if (a.mouseDownPoint && a.mouseDownPoint.button !== "right") {
        t.stopPropagation();
        t.preventDefault();
        ({ clientX: n, clientY: i, left: e, top: o } = a.mouseDownPoint);
        n = t.clientX - n;
        t = t.clientY - i;

        (Math.abs(n) < 4 && Math.abs(t) < 4) ||
          ((a.mouseDownPoint.hasMoved = true),
          (i = a.$parent.$parent.graph),
          (a.dump.left = e + n / i.scale),
          (a.dump.top = o + t / i.scale));
      }
    }
    t.stopPropagation();

    a.mouseDownPoint = {
      hasMoved: false,
      clientX: t.clientX,
      clientY: t.clientY,
      offsetX: t.offsetX,
      offsetY: t.offsetY,
      button: t.button === 0 ? "left" : "right",
      left: a.dump.left,
      top: a.dump.top,
    };

    document.addEventListener("mousemove", o);

    document.addEventListener("mouseup", function t(e) {
      if (a.mouseDownPoint) {
        if (a.mouseDownPoint.button === "right") {
          if (!a.mouseDownPoint.hasMoved) {
            a.contextMenu(a.mouseDownPoint);
          }
        } else if (a.mouseDownPoint.hasMoved) {
          a.$root.moveMotion(a.dump.level, {
            editorData: a.getCenterXY(),
          });
        } else {
          a.$parent.select(a.dump);
        }
      }

      document.removeEventListener("mousemove", o);
      document.removeEventListener("mouseup", t);
      a.mouseDownPoint = null;
    });
  },
  contextMenu() {
    const t = this;
    var e = [];
    const o = t.getCenterXY();
    o.centerX += 50;
    o.centerY += 50;
    const n = t.$root.queryData.envType;

    if (
      t.dump.type === n.AnimationBlend1D ||
      t.dump.type === n.AnimationBlend2D
    ) {
      e.push(
        {
          label: Editor.I18n.t("animation-graph.motion.addAnim"),
          click() {
            t.$root.addMotionToMotion(t.dump.level, {
              type: n.ClipMotion,
              editorData: o,
            });
          },
        },
        {
          label: Editor.I18n.t("animation-graph.motion.add1D"),
          click() {
            t.$root.addMotionToMotion(t.dump.level, {
              type: n.AnimationBlend1D,
              editorData: o,
            });
          },
        },
        {
          label: Editor.I18n.t("animation-graph.motion.add2D"),
          click() {
            t.$root.addMotionToMotion(t.dump.level, {
              type: n.AnimationBlend2D,
              editorData: o,
            });
          },
        }
      );
    }

    if (e.length > 0) {
      e.push({ type: "separator" });
    }

    if (t.dump.level.length !== 1) {
      e.push({
        label: Editor.I18n.t("animation-graph.motion.remove"),
        click() {
          t.$root.removeMotionInMotion(t.dump.level);
        },
      });
    }

    Editor.Menu.popup({ menu: e });
  },
  getCenter() {
    var t = this;
    var e = t.$el.offsetWidth;
    var o = t.$el.offsetHeight;
    return { left: t.dump.left + e / 2, top: t.dump.top + o / 2 };
  },
  setPosition() {
    var t = this;

    t.dump.width = t.$el.offsetWidth;
    t.dump.height = t.$el.offsetHeight;

    var e = t.$parent.getPosition({
      width: t.dump.width,
      height: t.dump.height,
      centerX: t.dump.editorData.centerX,
      centerY: t.dump.editorData.centerY,
    });

    t.dump.top = e.top;
    t.dump.left = e.left;
  },
  getCenterXY() {
    var t = this;
    return t.$parent.getCenterXY({
      width: t.dump.width,
      height: t.dump.height,
      left: t.dump.left,
      top: t.dump.top,
    });
  },
  changeMotionValue(t, e, o) {
    var n = this;
    var i = n.$root.queryData.envType;
    var a = t.target.value;
    switch (e.type) {
      case i.ClipMotion: {
        n.$root.changeClipMotionInMotion(e.level, a);
        break;
      }
      case i.AnimationBlend1D: {
        n.$root.changeAnimationBlend1DInMotion(e.level, o, a);
        break;
      }
      case i.AnimationBlend2D: {
        n.$root.changeAnimationBlend2DInMotion(
          e.level,
          o,
          i.animationBlendValue,
          a
        );
      }
    }
  },
  dragEnter(t) {},
  dragLeave(t) {},
  drop(t) {},
};
