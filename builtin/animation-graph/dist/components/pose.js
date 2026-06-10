var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.watch = undefined;
exports.computed = undefined;
exports.props = undefined;
exports.components = undefined;
exports.template = undefined;

exports.data = data;
exports.mounted = mounted;
const assert_1 = __importDefault(require("assert"));
function data() {
  return {
    addingLine: false,
    shadowLineStyle: { display: "none" },
    nodes: {},
    lines: {},
    mouseDownPoint: null,
  };
}
function mounted() {
  const e = this;
  e.refresh();

  setTimeout(() => {
    e.refresh();
  });
}
function populateMenus(e, o) {
  var n = [];
  for (const [a, { menu: p }] of e) {
    var s = p.split("/").filter((e) => e);
    if (s) {
      let t = n;
      var s_length = s.length;
      for (let e = 0; e < s_length; ++e) {
        const d = s[e];
        var i = t.find((e) => e.label === d);

        if (i) {
          if (e !== s_length - 1) {
            t = i.submenu ??= [];
          } else {
            console.warn("Duplicated menu item: " + p);
          }
        } else {
          i = { label: d };
          t.push(i);
          e === s_length - 1 ? (i.click = () => o(a)) : (t = i.submenu = []);
        }
      }
    } else {
      console.warn("Empty menu path.");
    }
  }
  return n;
}

exports.template = `
<section
    :adding-line="addingLine"
>
    <pose-node 
        v-for="(dump,id) in nodes" 
        :key="$root.queryData.assetInfo.uuid + '-pose-node-' + id"
        :ref="'node-'+id"
        :dump="dump"
        :active="dump.id===$root.queryData.view.poseExprNodeId"
    ></pose-node>
    <svg>
        <path ref="shadowLine"
            v-show="addingLine"
            :style="shadowLineStyle"
        ></path>
        <path class="line"
            v-for="(line,id) in lines" 
            :key="$root.queryData.assetInfo.uuid + '-pose-link-' + id"
            :ref="'link-'+id"
            :style="'--color-pose-link:'+getLineColor(line)"
            :d="getLinePath(line)"
            @mousedown.right.stop="lineContextMenu(line)"
        ></path>
    </svg>
</section>
`;

exports.components = { "pose-node": require("./pose-node") };
exports.props = ["graph"];

exports.computed = {
  droppable() {
    return Object.keys(this.graph.assetDragHandlersMap);
  },
};

exports.watch = {
  graph() {
    const e = this;
    e.refresh();

    setTimeout(() => {
      e.refresh();
    });
  },
};

exports.methods = {
  refresh() {
    var e = this;
    e.nodes = {};

    if (e.graph && e.graph.nodes) {
      for (const t of e.graph.nodes) {
        this.mergeNode(t);
      }
    }

    e.lines = {};

    if (e.graph && e.graph.links) {
      for (const o of e.graph.links) {
        this.mergeLine(o);
      }
    }
  },
  resize() {
    var e = this;
    for (const t in e.$refs) {
      if (Array.isArray(e.$refs[t])) {
        e.$refs[t].forEach((e) => {
          if (e.resize) {
            e.resize();
          }
        });
      }
    }
  },
  select(t) {
    const o = this;
    o.$children.forEach((e) => {
      if (e.dump.id === t.id) {
        o.$root.select({
          type: o.$root.queryData.envType.PoseExprNode,
          index: t.id,
        });
      }
    });
  },
  mergeNode(e) {
    var t = this;
    var o = t.$parent.graph;
    var e_id = e.id;
    t.$set(
      t.nodes,
      e_id,
      Object.assign({ id: e_id, top: o.centerY, left: o.centerX }, e)
    );
  },
  mergeLine(t) {
    var e = this;

    var o =
      `${t.sourceID}_${t.sourceOutputID}_to_${t.destinationID}_` +
      t.destinationInputID;

    var n = e.nodes[t.sourceID].outputs.find((e) => e.id === t.sourceOutputID);

    if (n) {
      n.destinationInputs || e.$set(n, "destinationInputs", []);
      n.destinationInputs.push([t.destinationID, t.destinationInputID]);
    }

    n = e.nodes[t.destinationID].inputs.find(
      (e) => e.id === t.destinationInputID
    );

    if (n) {
      n.sourceOutputs || e.$set(n, "sourceOutputs", []);
      n.sourceOutputs.push([t.sourceID, t.sourceOutputID]);
    }

    e.$set(e.lines, o, t);
  },
  getNode(e) {
    e = this.$refs["node-" + e];
    if (e) {
      return e[0];
    }
  },
  addShadowLine(a, p) {
    const d = this;
    d.addingLine = true;
    var [e, t, o, n] = p;
    const i = a ? t : n;
    const u = a ? e : o;
    t = d.getNode(u);

    n = (a ? t.dump.outputs : t.dump.inputs).find((e) => e.id === i);

    function l(t) {
      if (d.addingLine) {
        t.stopPropagation();
        t.preventDefault();
        var { clientX: t, clientY } = t;
        var n = d.mouseDownPoint.$el.getPointCenter(a, i);
        var left = d.$parent.graph.scale;
        var t = (t - n.clientX) / left;
        var clientY = (clientY - n.clientY) / left;

        var { left, top } = n;

        var t = n.left + t;
        var n = n.top + clientY;
        let e = d.drawLinePath(left, top, t, n);

        if (!a) {
          e = d.drawLinePath(t, n, left, top);
        }

        d.$refs.shadowLine.setAttribute("d", e);
      }
    }

    d.shadowLineStyle["--color-pose-link"] = d.$root.getPoseLinkColor(n.type);

    d.mouseDownPoint = { $el: t };
    d.$parent.$el.addEventListener("mousemove", l);

    d.$parent.$el.addEventListener("mouseup", function t(o) {
      if (o.button === 0) {
        d.$parent.$el.removeEventListener("mousemove", l);
        d.$parent.$el.removeEventListener("mouseup", t);

        setTimeout(() => {
          d.addingLine = false;
        });

        d.mouseDownPoint = null;
        d.$refs.shadowLine.setAttribute("d", "");
        var n;
        var s;
        var r;
        var { clientX: o, clientY } = o;
        let e = d.$el.getRootNode().elementFromPoint(o, clientY);

        while (e) {
          if (e.classList.contains("point")) {
            return (a && !e.classList.contains("input")) ||
              ((r = e.getAttribute("point-id")),
              (n = e.getAttribute("node-id")) === u)
              ? undefined
              : ((r = 1 == (s = a ? 3 : 1) ? Number(r) : r),
                (p[s - 1] = Number(n)),
                (p[s] = r),
                void d.$root.addPoseLink(p));
          }
          e = e.parentElement;
        }
      }
    });
  },
  getLineColor(e) {
    var { sourceID: e, sourceOutputID } = e;
    var e = this.getNode(e);
    return e
      ? ((e = e.dump.outputs[sourceOutputID]),
        this.$root.getPoseLinkColor(e.type))
      : "";
  },
  getLinePath(e) {
    var t = this;
    const { sourceID, sourceOutputID, destinationID, destinationInputID } = e;
    var i;
    var a;
    var e = t.getNode(sourceID);
    var p = t.getNode(destinationID);
    return !e ||
      !p ||
      ((i = e.dump.outputs.find((e) => e.id === sourceOutputID)),
      (t.$refs.shadowLine.style["--color-pose-link"] = t.$root.getPoseLinkColor(
        i.type
      )),
      (i = e.getPointCenter(true, sourceOutputID)),
      (e = p.getPointCenter(false, destinationInputID)),
      (p = i.left),
      (i = i.top),
      isNaN(p)) ||
      isNaN(i) ||
      ((a = e.left), (e = e.top), isNaN(a)) ||
      isNaN(e)
      ? ""
      : t.drawLinePath(p, i, a, e);
  },
  drawLinePath(e, t, o, n) {
    let s = e;
    var r = t;
    let i = (e + o) / 2;
    var a = n;
    var p = o < e ? 40 : Math.abs(e - o) / 2;
    var p = Math.min(120, Math.max(p, Math.abs((e - o) / 2)));

    var p =
      (s < e + p && (s = e + p),
      i > o - p && (i = o - p),
      `M${e},${t} C${s},${r} ${i},${a} ${o},` + n);

    return p;
  },
  contextMenu(t) {
    const o = this;

    var e = [
      {
        label: Editor.I18n.t("animation-graph.pose.paste"),
        enabled:
          o.$root.queryData.pasteInfo.type === "pose-nodes" ||
          o.$root.queryData.pasteInfo.type === "state-machine",
        click() {
          var e = o.getCenterXY({
            width: 1,
            height: 1,
            left: t.offsetX,
            top: t.offsetY,
          });
          o.$root.pasteIntoPoseGraph(e);
        },
      },
      { type: "separator" },
    ];

    var n = populateMenus(o.graph.addNodeInfos, (e) => {
      o.$root.addPoseNode({
        key: e,
        editorData: o.getCenterXY({
          width: 80,
          height: 30,
          left: t.offsetX,
          top: t.offsetY,
        }),
      });
    });

    var s = [
      { type: "separator" },
      {
        label: Editor.I18n.t("animation-graph.layer.stashGraph"),
        click() {
          o.$root.stashCurrentPoseGraph(
            o.getCenterXY({
              width: 80,
              height: 30,
              left: t.offsetX,
              top: t.offsetY,
            })
          );
        },
      },
    ];

    var r = [
      { type: "separator" },
      {
        label: Editor.I18n.t("animation-graph.layer.bestViewport"),
        click() {
          o.$parent.bestViewport();
        },
      },
    ];

    var e = e.concat(n, s, r);
    Editor.Menu.popup({ menu: e });
  },
  drop(e, t) {
    const o = this;
    e = e.currentTarget?.droppable;
    if (e) {
      (0, assert_1.default)(e.length === 1);
      var [e] = e;
      var n = o.graph.assetDragHandlersMap[e];
      if (n) {
        const r = (e) => {
          Editor.Message.send("scene", "execute-scene-script", {
            name: "animation-graph",
            method: "handleDropAssetIntoPoseGraph",
            args: [
              t.uuid,
              o.getCenterXY({
                width: 50,
                height: 30,
                left: t.offsetX,
                top: t.offsetY,
              }),
              e,
            ],
          });
        };
        var s = Object.keys(n.handlers);

        if (s.length === 0) {
          console.warn(`Asset type ${e} did not configure any handlers`);
        } else if (s.length === 1) {
          r(s[0]);
        } else {
          Editor.Menu.popup({
            menu: Object.entries(n.handlers).map(([e, t]) => ({
              label: t.displayName,

              click: () => {
                r(e);
              },
            })),
          });
        }
      } else {
        console.warn("There's no handlers configured for asset type " + e);
      }
    }
  },
  getCenterXY(e) {
    return this.$parent.getCenterXY(e, false);
  },
  getPosition(e) {
    return this.$parent.getPosition(e, false);
  },
  lineContextMenu(e) {
    const t = this;
    var { sourceID: e, sourceOutputID, destinationID, destinationInputID } = e;
    const r = [e, sourceOutputID, destinationID, destinationInputID];
    e = [
      {
        label: Editor.I18n.t("animation-graph.pose.link.remove"),
        click() {
          t.$root.removePoseLink(r);
        },
      },
    ];
    Editor.Menu.popup({ menu: e });
  },
  crumbPoseNode(e) {
    if (!this.addingLine) {
      this.$root.crumbPoseNode(e);
    }
  },
};
