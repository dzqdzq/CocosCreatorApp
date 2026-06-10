var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, a, i = a) => {
        var n = Object.getOwnPropertyDescriptor(t, a);

        if (
          !n ||
          (!("get" in n) ? !n.writable && !n.configurable : t.__esModule)
        ) {
          n = {
            enumerable: true,
            get() {
              return t[a];
            },
          };
        }

        Object.defineProperty(e, i, n);
      }
    : (e, t, a, i) => {
        e[(i = i === undefined ? a : i)] = t[a];
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
    var n = (e) =>
      (n =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var a = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              a[a.length] = t;
            }
          }
          return a;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var a = n(e), i = 0; i < a.length; i++) {
          if (a[i] !== "default") {
            __createBinding(t, e, a[i]);
          }
        }
      }
      __setModuleDefault(t, e);
      return t;
    };
  })();

var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));

Object.defineProperty(exports, "__esModule", { value: true });

exports.listeners = undefined;
exports.methods = undefined;
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;

exports.ready = ready;
exports.beforeClose = beforeClose;
exports.close = close;

const { throttle } = require("lodash");

const { readFileSync } = require("fs");

const { join } = require("path");

const VmConfig = __importStar(require("./vm/index"));
const vue_js_1 = __importDefault(require("vue/dist/vue.js"));
const pinia_1 = require("pinia");

const { createPinia } = pinia_1;

const { IquerySceneMode, IqueryAnimationRoot } = require("./share/ipc-event");

const { sortKeysToTreeMap } = require("./utils");

const animation_ctrl_1 = require("./share/animation-ctrl");
const global_data_1 = require("./share/global-data");
const animation_editor_1 = require("./share/animation-editor");
const grid_ctrl_1 = require("./share/grid-ctrl");
const Utils = __importStar(require("./utils"));
const pop_menu_1 = require("./share/pop-menu");
vue_js_1.default.config.productionTip = !Editor.App.dev;
vue_js_1.default.config.devtools = !Editor.App.dev;
vue_js_1.default.config.silent = !Editor.App.dev;
vue_js_1.default.use(pinia_1.PiniaVuePlugin);
let panel = null;
let vm = null;
exports.style = readFileSync(join(__dirname, "../index.css"), "utf8");
const vueTemplate = readFileSync(
  join(__dirname, "../../static", "/template/index.html"),
  "utf8"
);
function ready() {
  panel = this;

  panel.onChangeNode = throttle(_onChangeNode.bind(panel), 100);

  this.cancelNodeChange = cancelNodeChange.bind(this);
  animation_editor_1.animationEditor.panel = panel;
  initVue();

  if (Editor.App.dev || Editor.App.args.spectron) {
    toggleAnimationEditor();
  }
}
async function beforeClose() {
  if (vm && vm.animationMode) {
    if ("animation" !== (await IquerySceneMode())) {
      return true;
    }
    this.cancelNodeChange();

    if (!(await animation_ctrl_1.animationCtrl.exit())) {
      return false;
    }
  }
  return true;
}
function close() {
  animation_editor_1.animationEditor.close();
  vm?.$destroy();
  vm = null;
  panel = null;
}
function toggleAnimationEditor() {
  window.AnimationEditor = window.AnimationEditor
    ? null
    : {
        animationEditor: animation_editor_1.animationEditor,
        animationCtrl: animation_ctrl_1.animationCtrl,
        gridCtrl: grid_ctrl_1.gridCtrl,
        Utils,
        menuConfig: pop_menu_1.menuConfig,
        Test: require(join(__dirname, "../../test/tools/index.js")),
      };
}
function initVue() {
  animation_editor_1.animationEditor.reset();
  animation_ctrl_1.animationCtrl.reset();
  var e = createPinia();
  vm?.$destroy();

  vm = new vue_js_1.default({
    el: panel.$.container,
    name: "CCAnimator",
    ...VmConfig,
    template: vueTemplate,
    pinia: e,
  });
}
async function _onChangeNode(e, t) {
  var a;
  var i;

  if (
    panel &&
    !panel.hidden &&
    !(Editor.App.dev && console.debug("change-node", e), !vm) &&
    vm.animationState !== "play" &&
    (!vm.animationMode || vm.aniCompType !== "cc.animation.AnimationController")
  ) {
    if (vm.animationMode) {
      vm.aniCompType === "cc.SkeletalAnimation" &&
        animation_editor_1.animationEditor.checkUseBakedAnimationBySkeletalAnimation();

      await animation_editor_1.animationEditor.updateClipMenu();
    } else {
      a = await IqueryAnimationRoot(e);

      !vm ||
        vm.selectedId === "" ||
        ((i = await IqueryAnimationRoot(vm.selectedId)) && i !== a) ||
        global_data_1.Flags.lockUuid ||
        global_data_1.Flags.lockUuid === e ||
        ((global_data_1.Flags.lockUuid = e),
        global_data_1.Flags.lockTimer &&
          clearTimeout(global_data_1.Flags.lockTimer),
        await animation_editor_1.animationEditor.updateNode(e),
        (global_data_1.Flags.lockTimer = setTimeout(() => {
          global_data_1.Flags.lockUuid = "";
        }, 600)));
    }
  }
}
function cancelNodeChange() {
  this.onChangeNode.cancel();
}

exports.template = `
    <div class="animator"></div>
`;

exports.$ = { container: ".animator" };

exports.methods = {
  t: Editor.I18n.t,
  deleteSelected() {
    if (vm) {
      if (vm.selectEventInfo && animation_ctrl_1.animationCtrl.clipsDump) {
        animation_ctrl_1.animationCtrl.deleteEvent();
      } else if (vm.selectEmbeddedPlayerInfo) {
        animation_editor_1.animationEditor.deleteSelecteEmbeddedPlayers();
      } else if (
        !animation_editor_1.animationEditor.isLock &&
        animation_ctrl_1.animationCtrl.clipsDump
      ) {
        if (vm.selectKeyInfo) {
          animation_ctrl_1.animationCtrl.removeKey();
        } else if (vm.selectProperty) {
          if (
            animation_ctrl_1.animationCtrl.clipsDump.pathsDump[
              vm.selectProperty.nodePath
            ][vm.selectProperty.prop].parentPropKey
          ) {
            animation_editor_1.animationEditor.showToast(
              "i18n:animator.property.can_not_delete_part_property"
            );
          } else {
            animation_ctrl_1.animationCtrl.removeProp(vm.selectProperty);
          }
        }
      }
    }
  },
  nextStep: animation_editor_1.animationEditor.nextStep.bind(
    animation_editor_1.animationEditor
  ),
  prevStep: animation_editor_1.animationEditor.prevStep.bind(
    animation_editor_1.animationEditor
  ),
  jumpToNextKey: animation_editor_1.animationEditor.jumpToNextKey.bind(
    animation_editor_1.animationEditor
  ),
  jumpToPrevKey: animation_editor_1.animationEditor.jumpToPrevKey.bind(
    animation_editor_1.animationEditor
  ),
  jumpFirstFrame: animation_editor_1.animationEditor.jumpFirstFrame.bind(
    animation_editor_1.animationEditor
  ),
  jumpLastFrame: animation_editor_1.animationEditor.jumpLastFrame.bind(
    animation_editor_1.animationEditor
  ),
  showAllKeys() {
    if (vm) {
      vm.showAllKeys();
    }
  },
  showSelectedKeys() {
    if (vm) {
      vm.showSelectedKeys();
    }
  },
  copy: animation_editor_1.animationEditor.copy.bind(
    animation_editor_1.animationEditor
  ),
  paste: animation_editor_1.animationEditor.paste.bind(
    animation_editor_1.animationEditor
  ),
  selectAll(e) {
    if (e) {
      if (!e.path) {
        e.path = e.composedPath();
      }

      if (e.path && e.path[0].tagName === "INPUT") {
        return;
      }

      e.stopPropagation();
      e.preventDefault();
    }
    var t;

    if (
      vm &&
      !animation_editor_1.animationEditor.isLock &&
      animation_ctrl_1.animationCtrl.clipsDump &&
      vm.selectProperty &&
      vm.properties
    ) {
      e = animation_ctrl_1.animationCtrl.clipsDump.pathsDump[
        vm.computeSelectPath
      ][vm.selectProperty.prop].keyFrames.map((e) => ({
        ...e,
        nodePath: vm.computeSelectPath,
        rawFrame: e.frame,
        key: Utils.calcKeyFrameKey(e),
      }));

      t = sortKeysToTreeMap(e);

      vm.selectKeyInfo = {
        keyFrames: e,
        sortDump: t,
        prop: vm.selectProperty.prop,
        nodePath: vm.computeSelectPath,
        location: "prop",
      };
    }
  },
  createKey() {
    var e;
    var t;

    if (
      vm &&
      !animation_editor_1.animationEditor.isLock &&
      vm.selectProperty &&
      vm.computeSelectPath
    ) {
      if (
        !animation_ctrl_1.animationCtrl.clipsDump ||
        !animation_ctrl_1.animationCtrl.clipsDump.isLock
      ) {
        ({ prop: e, nodePath: t } = vm.selectProperty);

        t === vm.computeSelectPath &&
          animation_ctrl_1.animationCtrl.createKey({
            frame: vm.currentFrame,
            nodePath: t,
            prop: e,
          });
      }
    }
  },
  playOrPause() {
    if (vm && vm.animationMode) {
      if (vm.animationState === "stop" || vm.animationState === "pause") {
        animation_ctrl_1.animationCtrl.updatePlayState("play");
      } else {
        animation_ctrl_1.animationCtrl.updatePlayState("pause");
      }
    }
  },
  stop() {
    if (vm && vm.animationMode) {
      animation_ctrl_1.animationCtrl.updatePlayState("stop");
    }
  },
  clearSelect() {
    if (!animation_editor_1.animationEditor.isLock) {
      animation_editor_1.animationEditor.clearSelectData();
    }
  },
  changeRecordState() {
    if (vm && vm.currentClip && vm.active) {
      if (vm.animationMode) {
        this.cancelNodeChange();
        animation_ctrl_1.animationCtrl.exit();
      } else {
        animation_ctrl_1.animationCtrl.enter(vm.currentClip);
      }
    }
  },
  "change-debug-mode"() {
    toggleAnimationEditor();
  },
  "asset-db:asset-change"(t, a) {
    if (vm && Array.isArray(vm.clipsMenu)) {
      let e = false;
      for (const i of vm.clipsMenu) {
        if (i.uuid === t) {
          e = true;
          break;
        }
      }

      if (
        (e =
          a && a.extends?.includes("cc.animation.AnimationGraphLike")
            ? true
            : e)
      ) {
        setTimeout(() => {
          if (vm && vm.selectedId !== "") {
            animation_editor_1.animationEditor.updateNode(vm.selectedId);
          }
        }, 500);
      }
    }
  },
  async "asset-db:asset-delete"() {
    if (vm && Array.isArray(vm.clipsMenu)) {
      animation_editor_1.animationEditor.refreshTask++;
      await animation_editor_1.animationEditor.debounceRefresh();
    }
  },
  async "scene:ready"() {
    if (!global_data_1.Flags.sceneReady) {
      global_data_1.Flags.sceneReady = true;
      animation_editor_1.animationEditor.refreshTask++;
      vm && (await animation_editor_1.animationEditor.debounceRefresh());
    }
  },
  "scene:close"() {
    global_data_1.Flags.sceneReady = false;

    if (vm) {
      vm.loading = "wait_scene_ready";
    }

    animation_editor_1.animationEditor.onSceneClose();
    this.cancelNodeChange();
  },
  async "selection:activated"(e, t) {
    if (panel && !panel.hidden && vm && e === "node") {
      vm.selectedIds = new Set(t);
      vm.selectPath = "";

      t.length
        ? ((vm.selectedId = t[0]),
          vm.animationMode ||
            (await animation_editor_1.animationEditor.debounceUpdateNode(
              vm.selectedId
            )))
        : (vm.selectedId = "");
    }
  },
  "scene:change-node"(e, t) {
    if (global_data_1.Flags.sceneReady && panel) {
      panel.onChangeNode(e, t);
    }
  },
  "scene:animation-start"(e) {
    if (vm && e === vm.root && !vm.animationMode) {
      animation_editor_1.animationEditor.onEnter();
      console.debug("scene:animation-start");
    }
  },
  "scene:animation-end"() {
    global_data_1.Flags.sceneReady = false;

    if (vm && vm.animationMode) {
      vm.animationMode = false;
      console.debug("scene:animation-end");
    }
  },
  async "scene:animation-change"(e) {
    if (panel && !panel.hidden && e && vm && e === vm.root) {
      await animation_editor_1.animationEditor.updateClips(
        vm.currentClip,
        "update"
      );
    }
  },
  "scene:animation-state-change"(e) {
    animation_editor_1.animationEditor.updatePlayState(e);
  },
  "scene:change-mode"(e) {
    if (vm) {
      vm.currentSceneMode = e;
    }
  },
  async "scene:animation-clip-change"(e) {
    if (vm && e !== vm.currentClip) {
      await animation_editor_1.animationEditor.updateClips(e);
      vm.selectKeyInfo = null;
      vm.selectProperty = null;
    }
  },
  async enableEmbeddedPlayer() {
    if (vm) {
      vm.updateEnableEmbeddedPlayer();
    }
  },
  async enableAuxiliaryCurve() {
    if (vm) {
      vm.updateAuxCurveEnableState();
    }
  },
};

exports.listeners = {
  resize() {
    if (global_data_1.Flags.sceneReady && vm) {
      animation_editor_1.animationEditor.updateLayoutConfig();
      animation_editor_1.animationEditor.resize();
    }
  },
  async show() {
    if (global_data_1.Flags.sceneReady && vm) {
      await animation_editor_1.animationEditor.debounceRefresh();
    }
  },
};
