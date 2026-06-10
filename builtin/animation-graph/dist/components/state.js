function data() {
  return {
    addingLine: false,
    nodes: {},
    lines: {},
    lineHeight: 16,
    minStateWidth: 35,
    minStateHeight: 21,
    mouseDownPoint: null,
  };
}
function mounted() {
  this.refresh();
}
Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.watch = undefined;
exports.props = undefined;
exports.components = undefined;
exports.template = undefined;

exports.data = data;
exports.mounted = mounted;

exports.template = `
<section
    :adding-line="addingLine"
>
    <state-node
        v-for="(dump,id) in nodes" 
        :key="id"
        :ref="id"
        :type="dump.type"
        :active="dump.index===$root.queryData.view.stateIndex"
        :dump="dump"
    ></state-node>
    <state-line
        v-for="(dump,id) in lines" 
        :key="id"
        :ref="id"
        :dump="dump"
        :active="dump.indexes.includes($root.queryData.view.transitionIndex)"
    ></state-line>
    <div class="line shadow" ref="shadowLine"
        v-show="addingLine"
    >
        <ui-icon class="triangle" value="arrow-triangle-sharp" ref="triangle"></ui-icon>
    </div>
</section>
`;

exports.components = {
  "state-node": require("./state-node"),
  "state-line": require("./state-line"),
};

exports.props = ["graph"];

exports.watch = {
  graph() {
    this.refresh();
  },
};

exports.methods = {
  refresh() {
    var t = this;
    t.nodes = {};

    if (t.graph && t.graph.states) {
      for (const e of t.graph.states) {
        this.mergeNode(e);
      }
    }

    t.lines = {};

    if (t.graph && t.graph.transitions) {
      for (const a of t.graph.transitions) {
        this.mergeLine(a);
      }
    }
  },
  resize() {
    var t = this;
    for (const e in t.$refs) {
      if (Array.isArray(t.$refs[e])) {
        t.$refs[e].forEach((t) => {
          if (t.resize) {
            t.resize();
          }
        });
      }
    }
  },
  select(e) {
    const a = this;
    a.$children.forEach((t) => {
      if (t.dump.id === e.id) {
        a.$root.select(e);
      }
    });
  },
  mergeNode(t) {
    var e = this;
    var a = e.$parent.graph;
    var i = e.$root.generateStateId(t.editorData.id);
    e.$set(
      e.nodes,
      i,
      Object.assign({ id: i, top: a.centerY, left: a.centerX }, t)
    );
  },
  mergeLine(t) {
    var e = this;
    var a = e.graph.states[t.from.index];
    var i = e.graph.states[t.to.index];
    var a = e.$root.generateStateId(a.editorData.id);
    var i = e.$root.generateStateId(i.editorData.id);
    var o = a + "_to_" + i;
    var n = i + "_to_" + a;

    if (e.lines[o]) {
      e.lines[o].siblings.push(t.index);
      e.lines[o].indexes.push(t.index);
    } else {
      e.$set(
        e.lines,
        o,
        Object.assign(
          {
            id: o,
            reverseId: n,
            fromStateId: a,
            toStateId: i,
            siblings: [],
            indexes: [t.index],
          },
          t
        )
      );
    }
  },
  addLine(t, e) {
    Editor.Message.send("scene", "execute-scene-script", {
      name: "animation-graph",
      method: "addTransition",
      args: [t, e],
    });
  },
  addShadowLine(t) {
    const n = this;
    n.addingLine = true;
    t = n.$refs[t][0];
    const r = t.dump.index;
    var e = t.getCenter();
    function s(t) {
      var e;
      var a;
      var i;

      if (n.addingLine) {
        t.stopPropagation();
        t.preventDefault();
        ({ clientX: t, clientY: a } = t);
        e = (i = n.mouseDownPoint.$el.getBoundingClientRect()).x + i.width / 2;
        i = i.y + i.height / 2;
        e = (t - e) / (t = n.$parent.graph.scale);
        a = (a - i) / t;
        i = Math.sqrt(e ** 2 + a ** 2);
        t = Math.atan2(a, e) * (180 / Math.PI);
        n.$refs.shadowLine.style.width = i + "px";
        n.$refs.shadowLine.style.transform = `rotate(${t}deg)`;
      }
    }
    n.$refs.shadowLine.style.top = e.top - n.lineHeight / 2 + "px";
    n.$refs.shadowLine.style.left = e.left + "px";
    n.mouseDownPoint = { $el: t.$el };
    n.$parent.$el.addEventListener("mousemove", s);

    n.$parent.$el.addEventListener("mouseup", function e(a) {
      if (a.button === 0) {
        n.$parent.$el.removeEventListener("mousemove", s);
        n.$parent.$el.removeEventListener("mouseup", e);

        setTimeout(() => {
          n.addingLine = false;
        });

        n.mouseDownPoint = null;
        n.$refs.shadowLine.style.width = 0;
        var i;
        var { clientX: a, clientY } = a;
        let t = n.$el.getRootNode().elementFromPoint(a, clientY);

        while (t) {
          if (t.classList.contains("state")) {
            return t.__vue__ && t.__vue__.dump
              ? ((i = t.__vue__.dump.index), void n.addLine(r, i))
              : undefined;
          }
          t = t.parentElement;
        }
      }
    });
  },
  crumbState(t) {
    if (!this.addingLine) {
      this.$root.crumbState(t);
    }
  },
  contextMenu(e) {
    const a = this;
    const t = a.$root.queryData.envType;

    var i = a.$root.poseExprExperiment
      ? [
          { type: "separator" },
          {
            label: Editor.I18n.t(
              "animation-graph.state.addProceduralPoseState"
            ),
            click() {
              a.$root.addState({
                type: t.PoseExprState,
                editorData: a.getCenterXY({
                  width: 70,
                  height: 30,
                  left: e.offsetX,
                  top: e.offsetY,
                }),
              });
            },
          },
        ]
      : [];

    var i = [
      {
        label: Editor.I18n.t("animation-graph.state.paste"),
        enabled: a.$root.queryData.pasteInfo.type === "state",
        click() {
          var t = a.getCenterXY({
            width: 1,
            height: 1,
            left: e.offsetX,
            top: e.offsetY,
          });
          a.$root.pasteState(false, t);
        },
      },
      {
        label: Editor.I18n.t("animation-graph.state.pasteWithTransition"),
        enabled:
          a.$root.queryData.pasteInfo.type === "state" &&
          a.$root.queryData.pasteInfo.withTransitions,
        click() {
          var t = a.getCenterXY({
            width: 1,
            height: 1,
            left: e.offsetX,
            top: e.offsetY,
          });
          a.$root.pasteState(true, t);
        },
      },
      ...i,
      { type: "separator" },
      {
        label: Editor.I18n.t("animation-graph.state.addAnim"),
        click() {
          a.$root.addState({
            type: t.MotionState,
            motion: { type: t.ClipMotion },
            editorData: a.getCenterXY({
              width: 80,
              height: 30,
              left: e.offsetX,
              top: e.offsetY,
            }),
          });
        },
      },
      {
        label: Editor.I18n.t("animation-graph.state.add1D"),
        click() {
          a.$root.addState({
            type: t.MotionState,
            motion: { type: t.AnimationBlend1D },
            editorData: a.getCenterXY({
              width: 70,
              height: 30,
              left: e.offsetX,
              top: e.offsetY,
            }),
          });
        },
      },
      {
        label: Editor.I18n.t("animation-graph.state.add2D"),
        click() {
          a.$root.addState({
            type: t.MotionState,
            motion: { type: t.AnimationBlend2D },
            editorData: a.getCenterXY({
              width: 70,
              height: 30,
              left: e.offsetX,
              top: e.offsetY,
            }),
          });
        },
      },
      { type: "separator" },
      {
        label: Editor.I18n.t("animation-graph.layer.addSubStateMachine"),
        click() {
          a.$root.addState({
            type: t.SubStateMachine,
            subStateMachine: {},
            editorData: a.getCenterXY({
              width: 130,
              height: 30,
              left: e.offsetX,
              top: e.offsetY,
            }),
          });
        },
      },
      ...(a.graph.allowEmptyStates
        ? [
            {
              label: Editor.I18n.t("animation-graph.state.addEmpty"),
              click() {
                a.$root.addState({
                  type: t.EmptyState,
                  editorData: a.getCenterXY({
                    width: 80,
                    height: 30,
                    left: e.offsetX,
                    top: e.offsetY,
                  }),
                });
              },
            },
          ]
        : []),
      { type: "separator" },
      {
        label: "i18n:animation-graph.state.copyThisStateMachine",
        click() {
          Editor.Message.send("scene", "execute-scene-script", {
            name: "animation-graph",
            method: "copyCurrentStateMachine",
            args: [],
          });
        },
      },
      { type: "separator" },
      {
        label: Editor.I18n.t("animation-graph.layer.bestViewport"),
        click() {
          a.$parent.bestViewport();
        },
      },
    ];

    let o = -1;
    for (let t = a.$root.queryData.view.crumbs.length - 1; t >= 0; t--) {
      if (
        a.$root.queryData.view.crumbs[t].type ===
        a.$root.queryData.envType.SubStateMachine
      ) {
        o = t - 1;
        break;
      }
    }

    if (o >= 0) {
      i.push(
        { type: "separator" },
        {
          label: Editor.I18n.t("animation-graph.crumbs.back"),
          click() {
            a.$root.crumbView(o);
          },
        }
      );
    }

    Editor.Menu.popup({ menu: i });
  },
  drop(t, e) {
    var a = this.$root.queryData.envType;
    this.$root.addState({
      type: a.MotionState,
      motion: { type: a.ClipMotion, uuid: e.uuid },
      editorData: this.getCenterXY({
        width: 50,
        height: 30,
        left: e.offsetX,
        top: e.offsetY,
      }),
    });
  },
  getCenterXY(t) {
    return this.$parent.getCenterXY(t);
  },
  getPosition(t) {
    return this.$parent.getPosition(t);
  },
};
