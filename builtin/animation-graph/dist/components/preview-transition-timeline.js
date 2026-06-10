function data() {
  return { totalWidth: 0, baseWidth: 0 };
}
async function mounted() {
  await this.init();
}
async function destroyed() {
  this.close();
}
Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.computed = undefined;
exports.watch = undefined;
exports.props = undefined;
exports.template = undefined;

exports.data = data;
exports.mounted = mounted;
exports.destroyed = destroyed;

exports.template = `
<div class="timelines">
    <div class="tips"
        v-if="Math.abs(play.status.sourceMotionDuration)<1e-5 || Math.abs(play.status.targetMotionDuration)<1e-5"
    >
        <ui-label value="i18n:animation-graph.transition.invalidDurationPreview"></ui-label>
    </div>
    <template
        v-else
    >
        <div class="source timeline">
            <div class="content"
                :style="sourceStyle"
            >
                <div class="name">{{transition.from.name}}</div>
            </div>
            <div class="repeat"
                v-for="i in Math.floor(play.status.sourceMotionRepeatCount)"
                :style="calcSourceRepeat(i)"
            ></div>
        </div>
        <div class="transit timeline">
            <div class="content"
                :style="transitStyle"
            >
                <i class="transit-i start" ref="transitStart"
                    @mousedown="mouseDownTransitStart($event)"
                    v-if="transition.exitConditionEnabled"
                ></i>
                <div class="name"
                    @mousedown="mouseDownTransitName($event)"
                >{{play.status.transitionDurationLength.toFixed(2)}}</div>
                <i class="transit-i end" ref="transitEnd"
                    @mousedown="mouseDownTransitEnd($event)"
                ></i>
            </div>
        </div>
        <div class="target timeline">
            <div class="content"
                :style="targetStyle"
                @mousedown="mouseDownTransitDestinationStart($event)"
            >
                <i class="transit-i destination-start" ref="destinationStart"
                    :style="destinationStartStyle"
                ></i>
                <div class="name">{{transition.to.name}}</div>
            </div>
            <div class="repeat"
                v-for="i in Math.floor(play.status.targetMotionRepeatCount)"
                :style="calcTargetRepeat(i)"
            ></div>
        </div>
    </template>
</div>
`;

exports.props = ["play", "transition"];

exports.watch = {
  play() {
    this.update();
  },
};

exports.computed = {
  sourceStyle() {
    var t = this;
    return {
      width:
        t.play.status.sourceMotionRepeatCount *
          t.play.status.sourceMotionDuration *
          t.baseWidth +
        "px",
    };
  },
  transitStyle() {
    var t = this;
    return {
      width: t.play.status.transitionDurationLength * t.baseWidth + "px",
      marginLeft: t.play.status.transitionDurationStart * t.baseWidth + "px",
    };
  },
  targetStyle() {
    var t = this;

    var e =
      t.play.status.targetMotionRepeatCount *
      t.play.status.targetMotionDuration *
      t.baseWidth;

    var n =
      t.play.status.transitionDurationStart - t.play.status.targetMotionStart;

    return {
      width: e + "px",
      marginLeft:
        (t.play.status.transitionDurationStart - n) * t.baseWidth + "px",
    };
  },
  destinationStartStyle() {
    var t = this;
    return {
      width:
        (t.play.status.transitionDurationStart -
          t.play.status.targetMotionStart) *
          t.baseWidth +
        "px",
    };
  },
};

exports.methods = {
  init() {
    const t = this;

    t.resizeObserver = new window.ResizeObserver(() => {
      t.update();
    });

    t.resizeObserver.observe(t.$el);
  },
  close() {
    var t = this;

    if (t.resizeObserver) {
      t.resizeObserver.unobserve(t.$el);
    }
  },
  update() {
    var t = this;
    t.totalWidth = t.$el.clientWidth;
    t.baseWidth = t.totalWidth / t.play.status.timeLineLength;
  },
  calcSourceRepeat(t) {
    return {
      left: t * this.play.status.sourceMotionDuration * this.baseWidth + "px",
    };
  },
  calcTargetRepeat(t) {
    var e = this;

    var n =
      e.play.status.transitionDurationStart - e.play.status.targetMotionStart;

    return {
      left:
        (e.play.status.transitionDurationStart - n) * e.baseWidth +
        t * e.play.status.targetMotionDuration * e.baseWidth +
        "px",
    };
  },
  mouseDownTransitStart(t) {
    const o = this;
    function e(e) {
      if (o.mouseDownPoint && o.mouseDownPoint.button !== "right") {
        e.stopPropagation();
        e.preventDefault();
        var n = o.mouseDownPoint.clientX;
        var e = e.clientX - n;
        if (e != 0) {
          o.mouseDownPoint.hasMoved = true;
          n = o.mouseDownPoint.transitionDurationLength - e / o.baseWidth;
          e = o.mouseDownPoint.transitionDurationStart + e / o.baseWidth;
          if (!(e <= 0)) {
            let t = n;

            if (o.transition.relativeDuration) {
              t /= o.play.status.sourceMotionDuration;
            }

            o.$root.changeTransitionProp(o.transition.index, "duration", t);
            n = e;
            n /= o.play.status.sourceMotionDuration;

            o.$root.changeTransitionProp(
              o.transition.index,
              "exitCondition",
              n
            );
          }
        }
      }
    }
    t.stopPropagation();
    t.preventDefault();

    o.mouseDownPoint = {
      $element: t.target,
      hasMoved: false,
      clientX: t.clientX,
      clientY: t.clientY,
      offsetX: t.offsetX,
      offsetY: t.offsetY,
      button: t.button === 0 ? "left" : "right",
      transitionDurationStart: o.play.status.transitionDurationStart,
      transitionDurationLength: o.play.status.transitionDurationLength,
    };

    document.addEventListener("mousemove", e);

    document.addEventListener("mouseup", function t() {
      document.removeEventListener("mousemove", e);
      document.removeEventListener("mouseup", t);
      o.mouseDownPoint = null;
      o.$root.metric("A100010");
    });
  },
  mouseDownTransitEnd(t) {
    const o = this;
    function e(n) {
      if (o.mouseDownPoint && o.mouseDownPoint.button !== "right") {
        n.stopPropagation();
        n.preventDefault();
        var t = o.mouseDownPoint.clientX;
        var n = n.clientX - t;
        if (n != 0) {
          o.mouseDownPoint.hasMoved = true;
          let t = o.mouseDownPoint.transitionDurationLength + n / o.baseWidth;
          let e = (t = t <= 0 ? 0 : t);

          if (o.transition.relativeDuration) {
            e /= o.play.status.sourceMotionDuration;
          }

          o.$root.changeTransitionProp(o.transition.index, "duration", e);
        }
      }
    }
    t.stopPropagation();
    t.preventDefault();

    o.mouseDownPoint = {
      $element: t.target,
      hasMoved: false,
      clientX: t.clientX,
      clientY: t.clientY,
      offsetX: t.offsetX,
      offsetY: t.offsetY,
      button: t.button === 0 ? "left" : "right",
      transitionDurationLength: o.play.status.transitionDurationLength,
    };

    document.addEventListener("mousemove", e);

    document.addEventListener("mouseup", function t() {
      document.removeEventListener("mousemove", e);
      document.removeEventListener("mouseup", t);
      o.mouseDownPoint = null;
      o.$root.metric("A100010");
    });
  },
  mouseDownTransitName(t) {
    const n = this;
    function e(e) {
      if (n.mouseDownPoint && n.mouseDownPoint.button !== "right") {
        e.stopPropagation();
        e.preventDefault();
        var t = n.mouseDownPoint.clientX;
        var e = e.clientX - t;
        if (e != 0) {
          n.mouseDownPoint.hasMoved = true;
          let t = n.mouseDownPoint.transitionDurationStart + e / n.baseWidth;

          if (t <= 0) {
            t = 0;
          }

          t /= n.play.status.sourceMotionDuration;

          n.$root.changeTransitionProp(n.transition.index, "exitCondition", t);
        }
      }
    }
    t.stopPropagation();
    t.preventDefault();

    if (n.transition.exitConditionEnabled) {
      n.mouseDownPoint = {
        $element: t.target,
        hasMoved: false,
        clientX: t.clientX,
        clientY: t.clientY,
        offsetX: t.offsetX,
        offsetY: t.offsetY,
        button: t.button === 0 ? "left" : "right",
        transitionDurationStart: n.play.status.transitionDurationStart,
        transitionDurationLength: n.play.status.transitionDurationLength,
      };

      document.addEventListener("mousemove", e);

      document.addEventListener("mouseup", function t() {
        document.removeEventListener("mousemove", e);
        document.removeEventListener("mouseup", t);
        n.mouseDownPoint = null;
        n.$root.metric("A100010");
      });
    }
  },
  mouseDownTransitDestinationStart(t) {
    const o = this;
    function e(e) {
      if (o.mouseDownPoint && o.mouseDownPoint.button !== "right") {
        e.stopPropagation();
        e.preventDefault();
        var n = o.mouseDownPoint.clientX;
        var e = e.clientX - n;
        if (e != 0) {
          o.mouseDownPoint.hasMoved = true;
          let t = o.mouseDownPoint.destinationStart - e / o.baseWidth;
          n = t = t <= 0 ? 0 : t;
          n /= o.play.status.targetMotionDuration;

          o.$root.changeTransitionProp(
            o.transition.index,
            "destinationStart",
            n
          );
        }
      }
    }
    t.stopPropagation();
    t.preventDefault();

    if (o.transition.exitConditionEnabled) {
      o.mouseDownPoint = {
        $element: t.target,
        hasMoved: false,
        clientX: t.clientX,
        clientY: t.clientY,
        offsetX: t.offsetX,
        offsetY: t.offsetY,
        button: t.button === 0 ? "left" : "right",
        destinationStart:
          o.play.status.transitionDurationStart -
          o.play.status.targetMotionStart,
      };

      document.addEventListener("mousemove", e);

      document.addEventListener("mouseup", function t() {
        document.removeEventListener("mousemove", e);
        document.removeEventListener("mouseup", t);
        o.mouseDownPoint = null;
        o.$root.metric("A100010");
      });
    }
  },
};
