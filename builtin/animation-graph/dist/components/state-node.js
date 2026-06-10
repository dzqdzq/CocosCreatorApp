function data() {
  return { twinkle: "" };
}
function mounted() {
  this.refresh();
}
Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.watch = undefined;
exports.computed = undefined;
exports.props = undefined;
exports.template = undefined;

exports.data = data;
exports.mounted = mounted;

exports.template = `
    <div class="state"
        :style="style"
        :twinkle="twinkle"
        :subtype="subType"
        @mousedown="mouseDown($event)"
        @dblclick="crumb"
    >
        <div class="name" ref="name">
            <ui-icon class="image" value="pose"
                v-if="isPoseExpr"
            ></ui-icon>
            <ui-label class="label"
                :value="dump.name"
            ></ui-label>
            <ui-icon class="icon" value="arrow-triangle-sharp"
                v-if="isParent"
            ></ui-icon>
        </div>
        <div class="starter"
            @mousedown.left.stop="mouseDownStarter($event)"
        >
            <ui-icon class="icon" value="add"></ui-icon>
        </div>
    </div>
`;

exports.props = ["dump"];

exports.computed = {
  style() {
    return {
      top: Math.ceil(this.dump.top) + "px",
      left: Math.ceil(this.dump.left) + "px",
    };
  },
  isParent() {
    var t = this;
    return t.isSubStateMachine || t.isBlendMotion || t.isPoseExpr;
  },
  isSubStateMachine() {
    return this.dump.type === this.$root.queryData.envType.SubStateMachine;
  },
  isBlendMotion() {
    var t = this;
    return (
      t.dump.type === t.$root.queryData.envType.MotionState &&
      t.dump.props.motion &&
      t.$root.queryData.animationBlendType.includes(t.dump.props.motion.type)
    );
  },
  isPoseExpr() {
    return this.dump.type === this.$root.queryData.envType.PoseExprState;
  },
  canNotAddComponent() {
    return this.$root.stateCanNotAddComponent(this.dump.type);
  },
  canNotRemove() {
    return this.$root.stateCanNotRemove(this.dump.type);
  },
  canNotCopy() {
    return this.$root.stateCanNotCopy(this.dump.type);
  },
  subType() {
    return this.dump.props?.motion?.type;
  },
};

exports.watch = {
  dump() {
    this.refresh();
  },
};

exports.methods = {
  refresh() {
    const t = this;
    window.requestAnimationFrame(() => {
      t.setPosition();
    });
  },
  resize() {
    this.setPosition();
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
  mouseDown(t) {
    const a = this;
    function e(t) {
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

    a.mouseDownPoint = {
      $element: t.target,
      hasMoved: false,
      clientX: t.clientX,
      clientY: t.clientY,
      offsetX: t.offsetX,
      offsetY: t.offsetY,
      button: t.button === 0 ? "left" : "right",
      left: a.dump.left,
      top: a.dump.top,
    };

    if (a.mouseDownPoint.button === "right") {
      t.stopPropagation();
    }

    document.addEventListener("mousemove", e);

    document.addEventListener("mouseup", function t() {
      if (a.mouseDownPoint && a.mouseDownPoint.button === "right") {
        if (!a.mouseDownPoint.hasMoved) {
          a.contextMenu(a.mouseDownPoint.$element);
        }
      } else if (a.mouseDownPoint.hasMoved) {
        a.$root.moveState(a.dump.index, { editorData: a.getCenterXY() });
      } else {
        a.$parent.select(a.dump);
      }

      document.removeEventListener("mousemove", e);
      document.removeEventListener("mouseup", t);
      a.mouseDownPoint = null;
    });
  },
  mouseDownStarter(t) {
    this.$parent.addShadowLine(this.dump.id);
  },
  crumb() {
    this.$parent.crumbState(this.dump.index);
  },
  contextMenu(t) {
    const e = this;
    var o = [];

    if (!e.canNotCopy) {
      o.push(
        {
          label: Editor.I18n.t("animation-graph.state.copy"),
          click() {
            e.$root.copyState(e.dump.index);
          },
        },
        {
          label: Editor.I18n.t("animation-graph.state.duplicate"),
          click() {
            e.$root.duplicateState(e.dump.index);
          },
        },
        { type: "separator" }
      );
    }

    if (e.isParent) {
      o.push({
        label: Editor.I18n.t("animation-graph.crumbs.edit"),
        click() {
          e.$parent.select(e.dump);
          e.$root.crumbState(e.dump.index);
        },
      });

      o.push({ type: "separator" });
    }

    if (e.isBlendMotion) {
      o.push({
        label: Editor.I18n.t(
          "animation-graph.state.turnMotionStateIntoSubStateMachine"
        ),
        click() {
          e.$root.turnMotionStateIntoSubStateMachine(e.dump.index);
        },
      });

      o.push({ type: "separator" });
    }

    if (e.dump.type !== "ExitState") {
      o.push({
        label: Editor.I18n.t("animation-graph.transition.add"),
        click() {
          e.$parent.addShadowLine(e.dump.id);
        },
      });

      o.push({ type: "separator" });
    }

    if (!e.canNotAddComponent) {
      o.push({
        label: Editor.I18n.t("animation-graph.component.add"),
        click() {
          e.$root.addComponent(e.dump.index, t);
        },
      });

      o.push({ type: "separator" });
    }

    if (!e.canNotRemove) {
      o.push({
        label: Editor.I18n.t("animation-graph.state.remove"),
        click() {
          e.$root.removeState(e.dump.index);
        },
      });
    }

    Editor.Menu.popup({ menu: o });
  },
  getCenter() {
    var t = this;
    var e = t.$el.offsetWidth;
    var o = t.$el.offsetHeight;
    return { left: t.dump.left + e / 2, top: t.dump.top + o / 2 };
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
};
