function data() {
  return { mouseDownPoint: null };
}
function mounted() {}
Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.watch = undefined;
exports.computed = undefined;
exports.props = undefined;
exports.template = undefined;

exports.data = data;
exports.mounted = mounted;

exports.template = `
    <div class="line"
        :class="isCircle?'circle':''"
        :style="style"
        @mousedown="mouseDown($event)"
    >
        <ui-icon class="triangle" value="arrow-triangle-sharp" ref="triangle"></ui-icon>
        <ui-label class="count" ref="count"
            v-if="dump.siblings.length"
            :tooltip="countTip"
            :value="dump.siblings.length+1"
        ></ui-label>
    </div>
`;

exports.props = ["dump"];

exports.computed = {
  isCircle() {
    var t = this;
    t.$fromState = t.$parent.$refs[t.dump.fromStateId][0];
    t.$toState = t.$parent.$refs[t.dump.toStateId][0];
    return !(!t.$fromState || !t.$toState) && t.$fromState === t.$toState;
  },
  style() {
    var o = this;
    o.$fromState = o.$parent.$refs[o.dump.fromStateId][0];
    o.$toState = o.$parent.$refs[o.dump.toStateId][0];

    if (!o.$fromState || !o.$toState) {
      return {};
    }

    if (o.$fromState === o.$toState) {
      r = o.$fromState.getCenter();
      ({ offsetHeight: n, offsetWidth: i } = o.$fromState.$el);

      return {
        top: r.top - n / 2 - 13 + "px",
        left: r.left + i / 2 - 16 + "px",
        width: "30px",
        height: "30px",
        borderRadius: i / 2 + "px",
      };
    }
    {
      var n = !!o.$parent.lines[o.dump.reverseId];
      var r = o.$fromState.getCenter();
      var i = o.$toState.getCenter();
      var s = i.left - r.left;
      var i = i.top - r.top;
      var a = Math.sqrt(s ** 2 + i ** 2);
      var i = Math.atan2(i, s);
      var s = i * (180 / Math.PI);

      var o =
        (o.$refs.count &&
          (o.$refs.count.style = `transform: rotate(${360 - s}deg)`),
        o.$parent.lineHeight / 2);

      let t = r.top - o;
      let r_left = r.left;

      if (n) {
        r = o * Math.sin(i);
        n = o * Math.cos(i);
        r_left += r;
        t -= n;
      }

      return {
        top: t + "px",
        left: r_left + "px",
        width: a + "px",
        transform: `rotate(${s}deg)`,
      };
    }
  },
  countTip() {
    return Editor.I18n.t("animation-graph.transition.countTip").replace(
      "${count}",
      this.dump.siblings.length + 1
    );
  },
};

exports.watch = {};

exports.methods = {
  resize() {},
  mouseDown(t) {
    const o = this;
    o.mouseDownPoint = { button: t.button === 0 ? "left" : "right" };

    if (o.mouseDownPoint.button === "right") {
      t.stopPropagation();
    }

    document.addEventListener("mouseup", function t(e) {
      if (o.mouseDownPoint && o.mouseDownPoint.button === "right") {
        if (!o.mouseDownPoint.hasMoved) {
          o.contextMenu(o.mouseDownPoint);
        }
      } else if (!o.mouseDownPoint.hasMoved) {
        o.$parent.select(o.dump);
      }

      document.removeEventListener("mouseup", t);
      o.mouseDownPoint = null;
    });
  },
  contextMenu() {
    const t = this;

    if (t.dump.siblings.length) {
      Editor.Menu.popup({
        menu: [
          {
            label: Editor.I18n.t("animation-graph.transition.removeAll"),
            click() {
              t.$root.removeTransition(t.dump.index, true);
            },
          },
        ],
      });
    } else {
      Editor.Menu.popup({
        menu: [
          {
            label: Editor.I18n.t("animation-graph.transition.remove"),
            click() {
              t.$root.removeTransition(t.dump.index, false);
            },
          },
        ],
      });
    }
  },
};
