var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, r, i = r) => {
        var o = Object.getOwnPropertyDescriptor(t, r);

        if (
          !o ||
          (!("get" in o) ? !o.writable && !o.configurable : t.__esModule)
        ) {
          o = {
            enumerable: true,
            get() {
              return t[r];
            },
          };
        }

        Object.defineProperty(e, i, o);
      }
    : (e, t, r, i) => {
        e[(i = i === undefined ? r : i)] = t[r];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, t) => {
        Object.defineProperty(e, "default", { enumerable: true, value: t });
      }
    : (e, t) => {
        e.default = t;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var o = (e) =>
      (o =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var r = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              r[r.length] = t;
            }
          }
          return r;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var r = o(e), i = 0; i < r.length; i++) {
          if (r[i] !== "default") {
            __createBinding(t, e, r[i]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });

exports.components = undefined;
exports.methods = undefined;
exports.watch = undefined;
exports.computed = undefined;
exports.setup = undefined;
exports.data = undefined;
exports.directives = undefined;

exports.mounted = mounted;
const vue_js_1 = __importStar(require("vue/dist/vue.js"));
const animation_ctrl_1 = require("../share/animation-ctrl");
const ipc_event_1 = require("../share/ipc-event");

const {
  IquerySceneMode,
  IsetEditClip,
  IApplyOperation,
  IupdateEvent,
  IgetPropValueAtFrame,
  ImodifyCurveOfKey,
} = ipc_event_1;

const {
  transFrameByType,
  sortPropertyMenu,
  timeToFrame,
  calcKeyFrameKey,
  multiplyTrackWithTimer,
  checkCtrlOrCommand,
} = require("./../utils");

const grid_ctrl_1 = require("../share/grid-ctrl");

const { syncAxisX } = grid_ctrl_1;

const global_data_1 = require("../share/global-data");
const animation_editor_1 = require("../share/animation-editor");

const {
  useBaseStore,
  useGridStore,
  useI18n,
  useAuxCurveStore,
  useTransformEvent,
} = require("./hooks");

const directives_1 = require("./directives");

const { adaptDirectives } = directives_1;

const components_1 = require("./components");
const bezier_presets_1 = require("../share/bezier-presets");
const changeFailedClips = [];

exports.directives = adaptDirectives({
  set: directives_1.PropSet,
});

const data = () => ({
  loading: "wait_scene_ready",
  toast: { message: "" },
  currentFrame: 0,
  root: "",
  selectedId: "",
  selectedIds: new Set(),
  selectPath: "",
  moveNodePath: "",
  selectProperty: null,
  nodeDump: null,
  eventsDump: null,
  clipsMenu: [],
  selectKeyInfo: null,
  selectEventInfo: null,
  selectEmbeddedPlayerInfo: null,
  aniCompType: null,
  animationMode: false,
  animationState: "stop",
  editEventFrame: 0,
  maskPanel: "",
  selectDataChange: 0,
  nodesHeight: 0,
  nodeScrollInfo: null,
  propertyScrollInfo: null,
  embeddedPlayerScrollInfo: null,
  moveInfo: null,
  boxInfo: null,
  boxStyle: null,
  boxData: null,
  previewPointer: null,
  propertiesMenu: null,
  properties: null,
  updateKeyFrame: 0,
  updatePosition: 0,
  updateSelectKey: 1,
  updateSelectNode: 1,
  scrolling: false,
  expandInfo: {},

  layout: {
    topPec: 25,
    centerPec: 30,
    auxCurvePec: 15,
    leftPec: 30,
    _totalPec: 100,
    __version__: "1.0.1",
  },

  leftResizeMoving: false,

  expandLayout: {
    embeddedPlayer: false,
    node: true,
    property: true,
    auxiliaryCurve: false,
  },

  enableEmbeddedPlayer: true,
  filterInvalid: false,
  filterName: "",
  active: true,
  wrapModeList: [],
  showAnimCurve: false,
  showAnimEmbeddedPlayer: true,
  lightCurve: null,
  hasSelectedCurveClip: false,

  curveDisabledCCtypes: animation_editor_1.animationEditor.curveDisabledCCtypes,

  presetSize: 110,
  expandTab: "",
  searchPresetName: "",
  timeInfos: [],
  showType: "frame",
  embeddedPlayerGroups: [],
  showUseBakedAnimationWarn: false,
  useBakedAnimationWarnTip: null,
  currentSceneMode: "preview",
});

exports.data = data;

const setup = (e, t) => {
  var r = useBaseStore();
  var i = useGridStore();
  var o = useI18n().t;
  const a = (0, vue_js_1.toRef)(r, "isSkeletonClip");
  const n = (0, vue_js_1.toRef)(i, "offset");
  const s = (0, vue_js_1.toRef)(i, "scale");
  var i = (0, vue_js_1.toRef)(r, "clipConfig");
  var l = (0, vue_js_1.toRef)(r, "currentClip");
  var r = (0, vue_js_1.toRef)(r, "focusedCurve");
  var d = (0, vue_js_1.ref)();
  var p = (0, vue_js_1.ref)();
  var c = (0, vue_js_1.ref)();
  const u = (0, vue_js_1.ref)();
  var m = (0, vue_js_1.ref)();
  const _ = useAuxCurveStore();
  var f = useTransformEvent();

  f.onUpdate((e) => {
    if (grid_ctrl_1.gridCtrl.grid) {
      n.value = grid_ctrl_1.gridCtrl.grid.xAxisOffset;
      s.value = grid_ctrl_1.gridCtrl.grid.xAxisScale;
    }

    if (
      e !== "property" &&
      u.value &&
      u.value.curveCtrl &&
      grid_ctrl_1.gridCtrl.grid
    ) {
      syncAxisX(grid_ctrl_1.gridCtrl.grid, u.value.curveCtrl.grid);
    }

    grid_ctrl_1.gridCtrl.grid?.render();
    animation_editor_1.animationEditor.updatePositionInfo();
    u.value?.repaint();
    animation_editor_1.animationEditor.renderTimeAxis();
  });

  var h = (0, vue_js_1.computed)(() => _.enabled && a.value);

  const y = (0, vue_js_1.ref)({});
  return {
    t: o,
    auxCurveStore: _,
    currentClip: l,
    clipConfig: i,
    isSkeletonClip: a,
    offset: n,
    scale: s,
    curve: u,
    auxCurve: m,
    gridCanvas: c,
    chart: d,
    right: p,
    focusedCurve: r,
    toPercent: (e) => e + "%",
    transformEvent: f,
    enableAuxCurve: h,
    updateAuxCurveEnableState: async () => {
      await _.updateEnableState();
    },
    onAddEmbeddedPlayer: (e) => {
      const t = typeof e.group == "string" && e.group ? e.group : "";

      if (t !== "") {
        vue_js_1.default.set(y.value, t, e);
      }

      animation_editor_1.animationEditor.addEmbeddedPlayer(e).finally(() => {
        if (t !== "") {
          vue_js_1.default.delete(y.value, t);
        }
      });
    },
    isEmbeddedPlayerAdding: (e) => (0, vue_js_1.unref)(y)[e] !== undefined,
  };
};

exports.setup = setup;

const vComputed = {
  displayLayout() {
    const t = this;
    if (!Object.keys(t.expandLayout).filter((e) => !t.expandLayout[e]).length) {
      return t.layout;
    }
    const r = { ...t.layout };
    var e = ["topPec", "centerPec", "auxCurvePec"];
    var i = animation_editor_1.animationEditor.layoutConfig.totalPec;

    if (!t.expandLayout.embeddedPlayer) {
      r.topPec = 0;

      e.splice(
        e.findIndex((e) => e === "topPec"),
        1
      );
    }

    if (!t.expandLayout.node) {
      r.centerPec = 0;

      e.splice(
        e.findIndex((e) => e === "centerPec"),
        1
      );
    }

    if (!t.expandLayout.auxiliaryCurve) {
      r.auxCurvePec = 0;

      e.splice(
        e.findIndex((e) => e === "auxCurvePec"),
        1
      );
    }

    if (!t.expandLayout.property) {
      i = i - (r.topPec + r.centerPec + r.auxCurvePec);
      if (e.length > 0 && i > 0) {
        const o = i / e.length;
        e.forEach((e) => {
          r[e] += o;
        });
      }
    }

    return r;
  },
  currentTime() {
    return transFrameByType(this.currentFrame, this.showType, this.sample);
  },
  displayPropertiesMenu() {
    var e;
    return this.propertiesMenu
      ? ((e = sortPropertyMenu(this.propertiesMenu, this.properties ?? {})),
        animation_editor_1.animationEditor.calcCreatePropMenu(e))
      : [];
  },
  selectPropertyRenderDump() {
    var e;
    var t = this;
    return t.selectProperty && t.selectProperty.dump
      ? ((e = JSON.parse(JSON.stringify(t.selectProperty.dump))).extends &&
          e.extends.includes("cc.Asset") &&
          (e.type === e.extends[0] ||
            e.extends[0].startsWith("cc.") ||
            ((e.type = e.extends[0]),
            (t.selectProperty.dump.type = e.extends[0]))),
        (e.readonly =
          (t.clipConfig && t.clipConfig.isLock) || t.selectProperty.missing),
        JSON.stringify(e))
      : null;
  },
  presetArr() {
    const t = this;
    return t.searchPresetName
      ? bezier_presets_1.defaultBezier.value.filter((e) =>
          new RegExp(t.searchPresetName, "i").test(e.name)
        )
      : bezier_presets_1.defaultBezier.value;
  },
  lock() {
    return Boolean(
      !this.clipConfig ||
        this.clipConfig.isLock ||
        this.maskPanel ||
        !this.animationMode
    );
  },
  selectPropData() {
    var e;
    var t;
    return animation_ctrl_1.animationCtrl.clipsDump && this.selectProperty
      ? (({ prop: e, nodePath: t } = this.selectProperty),
        animation_ctrl_1.animationCtrl.clipsDump.pathsDump[t] &&
          animation_ctrl_1.animationCtrl.clipsDump.pathsDump[t][e])
      : null;
  },
  computeSelectPath() {
    var e = this;
    if (!e.updateSelectNode) {
      return "";
    }
    if (e.selectPath) {
      return e.selectPath;
    }
    let t = "";
    return (t =
      e.selectedId && e.nodeDump
        ? animation_ctrl_1.animationCtrl.nodesDump.uuid2path[e.selectedId]
        : t);
  },
  sample() {
    let e = 60;

    if (this.clipConfig) {
      e = this.clipConfig.sample;
    }

    animation_editor_1.animationEditor.updateSample(e);
    return e;
  },
  lastFrameInfo() {
    let e = 0;

    if (this.clipConfig && this.clipConfig.duration) {
      e = timeToFrame(this.clipConfig.duration, this.sample);
    }

    var t = grid_ctrl_1.gridCtrl.frameToCanvas(e);
    return { frame: e, x: t };
  },
  propertyHeight() {
    const t = this;
    if (!t.properties) {
      return 0;
    }
    let r = 0;

    Object.keys(t.properties).forEach((e) => {
      if (!t.properties[e].hidden) {
        r += animation_editor_1.animationEditor.LINE_HEIGHT;
      }
    });

    return r;
  },
  stickInfo() {
    const r = this;
    if (
      !r.properties ||
      !r.selectKeyInfo ||
      !r.selectKeyInfo.keyFrames ||
      r.selectKeyInfo.keyFrames.length < 2 ||
      !r.updateSelectKey ||
      !r.updatePosition ||
      !r.propertyScrollInfo
    ) {
      animation_editor_1.animationEditor.hasShowStick = false;
      return null;
    }
    const i = [];
    const o = [];
    const a = [];

    r.selectKeyInfo.keyFrames.forEach((e, t) => {
      if (
        !r.computeSelectPath ||
        !r.selectKeyInfo.keyFrames[t] ||
        r.selectKeyInfo.keyFrames[t].nodePath === r.computeSelectPath
      ) {
        i.push(e.x || 0);
        r.properties[e.prop] && o.push(r.properties[e.prop].top);
        a.push(e.frame);
      }
    });

    a.sort((e, t) => e - t);

    animation_editor_1.animationEditor.stickInfo.leftFrame = a[0];
    animation_editor_1.animationEditor.stickInfo.rightFrame = a[a.length - 1];

    i.sort((e, t) => e - t);

    o.sort((e, t) => e - t);

    return i[i.length - 1] === i[0]
      ? ((animation_editor_1.animationEditor.hasShowStick = false), null)
      : ((animation_editor_1.animationEditor.stickInfo.width =
          i[i.length - 1] - i[0] + 18),
        (animation_editor_1.animationEditor.stickInfo.height =
          o[o.length - 1] -
          o[0] +
          animation_editor_1.animationEditor.LINE_HEIGHT),
        (animation_editor_1.animationEditor.stickInfo.left =
          i[0] + grid_ctrl_1.gridCtrl.grid.xAxisOffset - 10),
        (animation_editor_1.animationEditor.stickInfo.top =
          o[0] - r.propertyScrollInfo.top),
        (animation_editor_1.animationEditor.hasShowStick = true),
        JSON.parse(
          JSON.stringify(animation_editor_1.animationEditor.stickInfo)
        ));
  },
  curveData() {
    var e = this;
    if (!e.selectProperty || !e.showAnimCurve || !e.properties) {
      animation_editor_1.animationEditor.repaintCurve(null);
      return null;
    }
    var t =
      animation_ctrl_1.animationCtrl.clipsDump?.pathsDump[
        e.selectProperty.nodePath
      ];
    if (!t) {
      return null;
    }
    var r = t[e.selectProperty.prop];
    if (
      !(r && r.isCurveSupport && r.type && e.properties[e.selectProperty.prop])
    ) {
      animation_editor_1.animationEditor.repaintCurve(null);
      return null;
    }
    if (
      r.type &&
      animation_editor_1.animationEditor.curveDisabledCCtypes.includes(
        r.type.value
      )
    ) {
      animation_editor_1.animationEditor.repaintCurve(null);
      return null;
    }
    var i = {
      curveInfos: {},
      wrapMode: e.clipConfig.wrapMode,
      duration: e.clipConfig.duration * e.clipConfig.sample,
    };
    let o = false;
    if (r.partKeys) {
      for (const n of r.partKeys) {
        var a = t[n];

        i.curveInfos[n] = {
          keys: a.keyFrames.map((e) => e.curve).filter((e) => !!e),
          preWrapMode: a.preExtrap,
          postWrapMode: a.postExtrap,
          color: e.properties[n].color,
        };

        o = !(!o && !i.curveInfos[n].keys.find((e) => e.easingMethod));
      }
    } else {
      i.curveInfos = {
        [e.selectProperty.prop]: {
          keys: r.keyFrames.map((e) => e.curve).filter((e) => !!e),
          preWrapMode: r.preExtrap,
          postWrapMode: r.postExtrap,
          color: e.properties[e.selectProperty.prop].color,
        },
      };

      o = !(
        !o &&
        !i.curveInfos[e.selectProperty.prop].keys.find((e) => e.easingMethod)
      );
    }

    if (animation_editor_1.animationEditor.checkCurveDataDirty(i)) {
      animation_editor_1.animationEditor.repaintCurve(i);
    }

    return { ...i, hasUserEasingMethod: o };
  },
  curveStyle() {
    return this.showAnimCurve && this.computeSelectPath
      ? { width: "100%", height: "100%" }
      : { display: "none" };
  },
  stickBoxStyle() {
    var e = this;
    return e.stickInfo
      ? {
          width: e.stickInfo.width + "px",
          height: e.stickInfo.height + "px",
          top: e.stickInfo.top + "px",
          left: e.stickInfo.left + "px",
        }
      : null;
  },
  currentKeyEmptyInfo() {
    const r = this;
    if (!animation_ctrl_1.animationCtrl.clipsDump || !r.properties) {
      return {};
    }
    const i = {};

    const o =
      animation_ctrl_1.animationCtrl.clipsDump.pathsDump[r.computeSelectPath];

    if (o) {
      Object.keys(r.properties).forEach((e) => {
        var t;

        if (o[e]) {
          t = o[e].keyFrames;
          i[e] = !t.find((e) => e.frame === r.currentFrame);
        }
      });
    }

    return i;
  },
  nodeTitle() {
    return this.filterInvalid
      ? "i18n:animator.node.nodeHasAnimation"
      : "i18n:animator.node.title";
  },
};

async function mounted() {
  var e = this;

  var t =
    (animation_ctrl_1.animationCtrl.init(e),
    animation_editor_1.animationEditor.init(e),
    (global_data_1.Flags.sceneReady = await Editor.Message.request(
      "scene",
      "query-is-ready"
    )),
    global_data_1.Flags.sceneReady &&
      (await animation_editor_1.animationEditor.debounceRefresh()),
    (e.wrapModeList = await Editor.Message.request(
      "scene",
      "query-enum-list-with-path",
      "AnimationClip.WrapMode"
    )),
    e.wrapModeList?.forEach((e) => {
      e.tip =
        Editor.I18n.t(`animator.animationCurve.WrapMode.${e.name}.tip`) ||
        e.name;

      e.name =
        Editor.I18n.t(`animator.animationCurve.WrapMode.${e.name}.label`) ||
        e.name;
    }),
    await animation_editor_1.animationEditor.getConfig("layout"));

  if (t && typeof t == "object") {
    t.topPec ||
      ((t.topPec =
        (t.top && (t.top / e.$refs.container.offsetHeight) * 100) || 25),
      (t.leftPec =
        (t.left && (t.left / e.$refs.container.offsetWidth) * 100) || 30));

    typeof t.topPec == "string" &&
      (t.topPec = Number(t.topPec.replace("%", "")) || 25);

    typeof t.leftPec == "string" &&
      (t.leftPec = Number(t.leftPec.replace("%", "")) || 30);

    t.centerPec = t.centerPec ?? 30;
    Object.assign(e.layout, t);
  }

  e.expandLayout = Object.assign(
    e.expandLayout,
    (await animation_editor_1.animationEditor.getConfig("expandLayout")) || {}
  );

  await e.updateEnableEmbeddedPlayer();
  await e.updateAuxCurveEnableState();
  e.selectedIds = new Set(Editor.Selection.getSelected("node"));
  e.selectedId = Editor.Selection.getLastSelected("node");
  e.currentSceneMode = await IquerySceneMode();
}
exports.computed = vComputed;

exports.watch = {
  async selectedId(e, t) {
    var r = this;
    const r_computeSelectPath = r.computeSelectPath;
    if (
      (r.selectKeyInfo &&
        r.selectKeyInfo.keyFrames.find(
          (e) => e.nodePath !== r_computeSelectPath
        ) &&
        (r.selectKeyInfo = null),
      !e && animation_ctrl_1.animationCtrl.nodesDump) &&
      animation_ctrl_1.animationCtrl.nodesDump.uuid2path[t] !==
        r_computeSelectPath &&
      r_computeSelectPath
    ) {
      return;
    }
    r.updateSelectNode = -r.updateSelectNode;
    await animation_editor_1.animationEditor.updateSelectedId();

    if (
      r.properties &&
      ((r.selectProperty &&
        r.selectProperty.nodePath !== r_computeSelectPath) ||
        !r.selectProperty)
    ) {
      e = Object.keys(r.properties)[0];

      animation_editor_1.animationEditor.updateSelectProperty({
        nodePath: r_computeSelectPath,
        prop: e,
        missing: r.properties[e].missing,
        clipUuid: animation_ctrl_1.animationCtrl.clipsDump.uuid,
        isCurveSupport: r.properties[e].isCurveSupport,
      });
    } else {
      r.selectProperty = null;
    }
  },
  selectKeyInfo() {
    if (this.showAnimCurve) {
      if (animation_editor_1.animationEditor.selectKeyUpdateFlag) {
        animation_editor_1.animationEditor.updateCurveSelecteKeys();
      }
    } else {
      animation_editor_1.animationEditor.selectKeyUpdateFlag = true;
    }
  },
  root() {
    this.filterInvalid = false;
    this.filterName = "";
    this.nodesHeight = 0;
  },
  async currentClip(e, t) {
    var r;
    var i = this;

    if (e !== t && e) {
      if (await IsetEditClip(e)) {
        i.selectEventInfo = null;

        r = await ((i.selectKeyInfo = null), ipc_event_1.IqueryPlayingClipTime)(
          i.currentClip
        );

        r = timeToFrame(r, i.sample);
        animation_editor_1.animationEditor.setCurrentFrame(r);
      } else {
        changeFailedClips.push(e);
        console.warn("Set edit clip failed!" + e);

        changeFailedClips.includes(t)
          ? (i.currentClip = "")
          : (i.currentClip = t);
      }
    }
  },
  layout: {
    deep: true,
    handler() {
      (0, vue_js_1.nextTick)(() => {
        animation_editor_1.animationEditor.resize();
      });
    },
  },
  currentFrame() {
    this.calcSelectProperty(null, true);
  },
  boxData() {
    const i = this;
    if (i.boxData && animation_ctrl_1.animationCtrl.clipsDump) {
      const { origin, h, w, type } = i.boxData;
      if (type !== "property" || i.properties) {
        var e = i.boxInfo?.rawKeyFrames;
        const s = e || [];
        const l = (type === "node" ? i.nodeScrollInfo : i.propertyScrollInfo)
          .top;

        const d = e
          ? (t) => {
              if (
                !s.find(
                  (e) =>
                    e.rawFrame === t.rawFrame &&
                    e.prop === t.prop &&
                    e.nodePath == e.nodePath
                )
              ) {
                s.push(t);
              }
            }
          : (e) => s.push(e);

        function r(e, t) {
          Object.values(e).forEach((r) => {
            var e =
              r.top +
              animation_editor_1.animationEditor.LINE_HEIGHT / 2 +
              animation_editor_1.animationEditor.KEY_SIZE_R -
              l;

            if (t || (e >= origin.y && e <= origin.y + h)) {
              r.keyFrames.forEach((e) => {
                var t = e.x + i.offset;

                if (t > origin.x && t < origin.x + w) {
                  t = {
                    frame: e.frame,
                    rawFrame: e.frame,
                    nodePath: r.nodePath,
                    x: e.x,
                    prop: r.prop,
                  };

                  d({ ...t, key: calcKeyFrameKey(t) });
                }
              });
            }
          });
        }

        if (type === "node") {
          Object.keys(
            animation_ctrl_1.animationCtrl.clipsDump.pathsDump
          ).forEach((t) => {
            var e = i.nodeDump.find((e) => e.path === t);

            if (
              e &&
              (e =
                e.top +
                animation_editor_1.animationEditor.LINE_HEIGHT / 2 +
                animation_editor_1.animationEditor.KEY_SIZE_R -
                l) >= origin.y &&
              e <= origin.y + h
            ) {
              r(animation_ctrl_1.animationCtrl.clipsDump.pathsDump[t], true);
            }
          });
        } else {
          r(i.properties);
        }

        s.sort((e, t) => e.frame - t.frame);

        i.selectKeyInfo = {
          nodePath: i.computeSelectPath,
          keyFrames: s,
          location: "prop",
          prop: i.selectProperty?.prop,
        };
      }
    }
  },
};

exports.methods = {
  onClipCurvePreset(e) {
    this.$refs.curve.curveCtrl.applyBezierToSelectedCurveClip(e);

    multiplyTrackWithTimer("hippoAnimator", {
      A100000: 1,
      project_id: Editor.Project.uuid,
      clip_id: this.currentClip,
      version: Editor.App.version,
    });
  },
  toggleExpandLayoutChange(e) {
    this.expandLayout[e] = !this.expandLayout[e];

    animation_editor_1.animationEditor.setConfig(
      "expandLayout",
      this.expandLayout
    );

    (0, vue_js_1.nextTick)(() => {
      animation_editor_1.animationEditor.resize();
    });
  },
  showSelectedKeys(e) {
    if (e) {
      this.focusedCurve = e;
    }

    switch (this.focusedCurve) {
      case "curve": {
        if (this.showAnimCurve && this.$refs.curve != null) {
          this.$refs.curve.zoomToSelectedKeys();
        }

        break;
      }
      case "auxCurve": {
        this.$refs.auxCurve.zoomToSelectedKeys();
      }
    }
  },
  showAllKeys(e) {
    if (e) {
      this.focusedCurve = e;
    }

    switch (this.focusedCurve) {
      case "curve": {
        if (this.showAnimCurve && this.clipConfig?.duration && this.curveData) {
          this.$refs.curve.zoomToFit();
        }

        break;
      }
      case "auxCurve": {
        this.$refs.auxCurve.zoomToFit();
      }
    }
  },
  onUpdateEvent(e, t, r) {
    if (r.length === 0) {
      animation_ctrl_1.animationCtrl.deleteEvent();
    } else {
      IApplyOperation(IupdateEvent(e, t, r));
    }
  },
  toggleInvalidNode() {
    this.filterInvalid = !this.filterInvalid;
    this.$refs.nodes.scrollTop = 0;
    this.nodeScrollInfo.top = 0;
    animation_editor_1.animationEditor.calcDisplayClips();
  },
  onFilter(e) {
    e.stopPropagation();
    e.preventDefault();

    if (this.filterName !== e.target.value) {
      animation_editor_1.animationEditor.debounceFilterNode(e.target.value);
    }
  },
  async calcSelectProperty(e, t = false) {
    var r = this;

    if ((e = t && r.selectProperty ? r.selectProperty : e)) {
      t = await IgetPropValueAtFrame(
        r.currentClip,
        e.nodePath,
        e.prop,
        r.currentFrame
      );
      r.selectProperty = Object.assign(e, { dump: t });
    }
  },
  queryDurationStyle(e) {
    if (!e || !grid_ctrl_1.gridCtrl.grid) {
      return "";
    }
    let t = grid_ctrl_1.gridCtrl.grid.valueToPixelH(0);

    if (t < 0) {
      t = 0;
    }

    let r = grid_ctrl_1.gridCtrl.grid.valueToPixelH(e) - t;

    if (r < 0) {
      t = r;
      r = 0;
    }

    return `transform: translateX(${t}px); width: ${r}px`;
  },
  pointerPosition(e = 0) {
    return (
      grid_ctrl_1.gridCtrl.frameToCanvas(this.currentFrame) +
      (e ?? grid_ctrl_1.gridCtrl.grid?.xAxisOffset ?? 0) -
      grid_ctrl_1.gridCtrl.startOffset
    );
  },
  onMouseWheel(e) {
    if (e.shiftKey) {
      animation_editor_1.animationEditor.moveTimeLine(
        process.platform === "darwin" ? e.deltaX : e.deltaY
      );
    } else if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      animation_editor_1.animationEditor.moveTimeLine(e.deltaY);
    } else {
      animation_editor_1.animationEditor.scaleTimeLineAt(
        -e.deltaY,
        Math.round(e.offsetX)
      );
    }
  },
  onMouseDown(e) {
    const t = this;
    t.moveNodePath = "";
    t.boxInfo = null;
    t.boxStyle = null;
    var r;
    var i = e.target.getAttribute("name");

    if (i !== "event") {
      t.selectEventInfo = null;
    }

    if (i !== "key" && i !== "stick" && !checkCtrlOrCommand(e)) {
      t.selectKeyInfo = null;
    }

    if (i !== "range" && i !== "stick" && !checkCtrlOrCommand(e)) {
      t.selectEmbeddedPlayerInfo = null;

      Editor.Selection.unselect(
        "animation-embeddedPlayer",
        Editor.Selection.getSelected("animation-embeddedPlayer")
      );
    }

    let o = null;
    function a() {
      if (e.offsetY > t.$refs["property-content"].offsetTop) {
        global_data_1.Flags.mouseDownName = "property";
      } else if (
        e.offsetY > t.$refs["node-content"].offsetTop &&
        e.offsetY < t.$refs["property-content"].offsetTop
      ) {
        global_data_1.Flags.mouseDownName = "node";
      }
    }
    switch (i) {
      case "time-pointer": {
        global_data_1.Flags.mouseDownName = "time-pointer";
        break;
      }
      case "pointer": {
        if (e.button !== 1) {
          global_data_1.Flags.mouseDownName = "pointer";
        }

        break;
      }
      case "stick": {
        global_data_1.Flags.mouseDownName = "stick";
        t.selectKeyInfo.startX = e.x;
        t.selectKeyInfo.offset = 0;
        t.selectKeyInfo.offsetFrame = 0;
        global_data_1.Flags.startDragStickInfo = { type: "center" };
        break;
      }
      default: {
        if (e.button === 1 || e.button === 2) {
          global_data_1.Flags.startDragGridInfo = {
            start: e.x,
            lastStart: e.x,
          };

          if (e.button === 2 && (a(), global_data_1.Flags.mouseDownName)) {
            break;
          }

          return void (global_data_1.Flags.mouseDownName = "grid");
        }

        if (i) {
          global_data_1.Flags.mouseDownName = i;
        }
      }
    }

    if (!o && !global_data_1.Flags.mouseDownName) {
      a();

      global_data_1.Flags.mouseDownName &&
        (o = {
          type: global_data_1.Flags.mouseDownName,
          ctrlKey: checkCtrlOrCommand(e),
        });
    }

    if (["node", "property"].includes(global_data_1.Flags.mouseDownName) && o) {
      r = grid_ctrl_1.gridCtrl.pageToCtrl(e.x, e.y);
      o.startX = r.x;
      o.startY = r.y;
      o.ctrlKey = checkCtrlOrCommand(e);

      o.ctrlKey &&
        t.selectKeyInfo &&
        t.selectKeyInfo.keyFrames &&
        (o.rawKeyFrames = t.selectKeyInfo.keyFrames);

      t.boxInfo = o;
    }
  },
  onPropertyListContextMouseDown(e) {
    global_data_1.Flags.mouseDownName = "property-list-content";
  },
  onScroll(e, t) {
    const r = this;
    if (!global_data_1.Flags.onScrolling) {
      const i = t === "node" ? r.nodeScrollInfo : r.propertyScrollInfo;
      const o = e.target.scrollTop;

      if (
        o !== i.top &&
        !(global_data_1.Flags.lastScrollTops.splice(0, 0, o),
        (global_data_1.Flags.lastScrollTops.length = 3),
        global_data_1.Flags.lastScrollTops[0] ===
          global_data_1.Flags.lastScrollTops[2]) &&
        !r.scrolling
      ) {
        global_data_1.Flags.onScrolling = true;
        r.scrolling = true;

        requestAnimationFrame(() => {
          i.top = o;

          if (!animation_ctrl_1.animationCtrl.nodesDump?.nodesDump) {
            animation_editor_1.animationEditor.calcNodes();
          }

          animation_editor_1.animationEditor.calcDisplayClips();
          r.updateKeyFrame++;
          r.scrolling = false;
          global_data_1.Flags.onScrolling = false;
        });
      }
    }
  },
  async onConfirm(e) {
    var t = e.target.getAttribute("name");
    var e = e.target.value;

    if (t === "sample") {
      animation_editor_1.animationEditor.updateSample(e);
    }

    await animation_ctrl_1.animationCtrl.updateConfig(t, e);
  },
  onStartResize(e, t) {
    animation_editor_1.animationEditor.onStartResize(e, t);
  },
  toggleAniCurve() {
    this.showAnimCurve = !this.showAnimCurve;

    (0, vue_js_1.nextTick)(() => {
      animation_editor_1.animationEditor.initCurve();
    });
  },
  async onEditEasingMethodCurve(e) {
    const t = this;
    if (t.showAnimCurve && t.curveData && t.curveData.hasUserEasingMethod) {
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();
      e = await Editor.Dialog.warn(
        Editor.I18n.t("animator.tips.abort_easing_method"),
        {
          buttons: [
            Editor.I18n.t("animator.cancel"),
            Editor.I18n.t("animator.abort"),
          ],
          default: 0,
          cancel: 0,
        }
      );
      if (e.response !== 0) {
        const r = [];
        const i = t.selectProperty.nodePath;
        for (const o of Object.keys(t.curveData.curveInfos)) {
          t.curveData.curveInfos[o].keys.forEach((e) => {
            if (e.easingMethod) {
              r.push(
                ImodifyCurveOfKey(t.currentClip, i, o, Math.round(e.point.x), {
                  easingMethod: 0,
                })
              );
            }
          });
        }
        IApplyOperation(r);
      }
    }
  },
  onShowUseBakedAnimationWarn(e) {
    if (this.useBakedAnimationWarnTip) {
      return;
    }
    const t = document.createElement("div");
    var r = document.createElement("ui-label");
    r.style.whiteSpace = "normal";

    r.setAttribute(
      "value",
      "i18n:animator.tips.use_baked_animation.detailed_warn_by_ska"
    );

    t.appendChild(r);
    const e_target = e.target;
    r = e_target.getBoundingClientRect();
    t.getBoundingClientRect();
    t.setAttribute(
      "style",
      `
            position: absolute;
            width: 608px;
            left: ${r.left - 22}px;
            top: ${r.top + r.height + 4}px;
            z-index: 101;
            display: block;
            border-radius: 2px;
            background: #424242ff;
            border: 1px solid #8f8f8fff;
            box-shadow: 0 0 12px 0 #000000a6;
            padding: 16px;    
        `
    );

    const o = (e) => {
      document.removeEventListener("mousedown", n);
      t.removeEventListener("mouseleave", a);

      if (this.useBakedAnimationWarnTip) {
        this.useBakedAnimationWarnTip = null;

        setTimeout(() => {
          t.remove();
        }, 100);
      }
    };

    const a = (e) => {
      if (!e.composedPath().includes(e_target)) {
        o(e);
      }
    };

    const n = (e) => {
      if (!e.composedPath().includes(t)) {
        o(e);
      }
    };

    t.addEventListener("mouseleave", a);
    document.addEventListener("mousedown", n);
    this.useBakedAnimationWarnTip = t;
    document.body.appendChild(t);
  },
  changeFrameShowType(e) {
    const t = this;
    requestAnimationFrame(() => {
      t.showType = e;
      grid_ctrl_1.gridCtrl.grid.labelShowType = e;
      grid_ctrl_1.gridCtrl.grid.updateLabels();
      animation_editor_1.animationEditor.setConfig("showType", e);
    });
  },
  onScale(e) {
    animation_editor_1.animationEditor.scaleTimeLineWith(e);
  },
  onTimeConfirm(e) {
    const t = this;
    var m = e.target.value;
    if (/^([0-9]*)f?$/.test(m)) {
      animation_editor_1.animationEditor.updateCurrentFrame(Number(m));
    } else {
      var i = animation_ctrl_1.animationCtrl.clipConfig.sample;
      var s = m.match(/^([0-9]*)-([0-9]*)$/);
      if (s) {
        s = Number(s[1]) * i + Number(s[2]);
        animation_editor_1.animationEditor.updateCurrentFrame(s);
      } else {
        s = /^((?<m>\d((\.\d*)?))m)?(?<s>(\d((\.\d*)?)))s$/;
        if (s.test(m)) {
          var { m, s } = r.match(o).groups;
          let e = timeToFrame(Number(s), i);

          if (m) {
            e += Number(m) * i;
          }

          animation_editor_1.animationEditor.updateCurrentFrame(e);
        }
        requestAnimationFrame(() => {
          if (!e.path) {
            e.path = e.composedPath();
          }

          e.path[0].value = t.currentTime;
        });
      }
    }
  },
  onPropChange(e) {
    if (this.selectProperty && (!e.detail || !e.detail.ignoreChange)) {
      e = {
        value: { newValue: e.target.dump.value },
        prop: this.selectProperty.prop,
        nodePath: this.computeSelectPath,
        frame: this.currentFrame,
      };

      animation_ctrl_1.animationCtrl.callByDebounce("createKey", e, {
        recordUndo: false,
      });
    }
  },
  onPropConfirm(e) {
    if (this.selectProperty && (!e.detail || !e.detail.ignoreChange)) {
      e = {
        value: { newValue: e.target.dump.value },
        prop: this.selectProperty.prop,
        nodePath: this.computeSelectPath,
        frame: this.currentFrame,
      };

      animation_ctrl_1.animationCtrl.callByDebounce("createKey", e);
    }
  },
  async onShowEmbeddedPlayerMenu(e) {
    var t = animation_editor_1.animationEditor.getEmbeddedPlayerMenu();
    Editor.Menu.popup({ menu: t });
  },
  async updateEnableEmbeddedPlayer() {
    this.enableEmbeddedPlayer =
      (await animation_editor_1.animationEditor.getConfig(
        "enableEmbeddedPlayer"
      )) ?? true;

    if (!this.enableEmbeddedPlayer) {
      this.expandLayout.embeddedPlayer = false;
    }
  },
};

exports.components = {
  "control-preview": components_1.ControlPointer,
  "control-track-tree": components_1.ControlTrackTree,
  "preview-row": components_1.PreviewRow,
  "preview-range-row": components_1.PreviewRangeRow,
  "tool-bar": components_1.AnimatorToolbar,
  "node-tree": components_1.NodeTree,
  "property-tree": components_1.PropertyTree,
  "tips-mask": components_1.TipsMask,
  events: components_1.EventsRow,
  "property-tools": components_1.PropertyTools,
  "event-editor": components_1.EventEditor,
  "ctrl-stick": components_1.CtrlStick,
  "ani-mask": components_1.AniMask,
  AuxiliaryCurves: components_1.AuxiliaryCurves,
  AuxiliaryCurveFrames: components_1.AuxiliaryCurveFrames,
  CurvePresets: components_1.CurvePresets,
  PropertyCurve: components_1.PropertyCurve,
};
