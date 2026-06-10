var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, n, i = n) => {
        var r = Object.getOwnPropertyDescriptor(t, n);

        if (
          !r ||
          (!("get" in r) ? !r.writable && !r.configurable : t.__esModule)
        ) {
          r = {
            enumerable: true,
            get() {
              return t[n];
            },
          };
        }

        Object.defineProperty(e, i, r);
      }
    : (e, t, n, i) => {
        e[(i = i === undefined ? n : i)] = t[n];
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
    var r = (e) =>
      (r =
        Object.getOwnPropertyNames ||
        ((e) => {
          var t;
          var n = [];
          for (t in e) {
            if (Object.prototype.hasOwnProperty.call(e, t)) {
              n[n.length] = t;
            }
          }
          return n;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var t = {};
      if (e != null) {
        for (var n = r(e), i = 0; i < n.length; i++) {
          if (n[i] !== "default") {
            __createBinding(t, e, n[i]);
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

const general_scene_facade_1 = __importDefault(
  require("./general-scene-facade")
);

const gameview_scene_proxy_1 = __importDefault(
  require("../manager/scene/proxy/gameview-scene-proxy")
);

const scene_facade_state_interface_1 = require("./scene-facade-state-interface");
const preview_play_1 = __importDefault(require("../manager/preview-play"));
const cc_1 = require("cc");
const event_enum_1 = require("../../public/event-enum");
const operation_1 = __importStar(require("../../public/operation"));
const stopPropagation = () => {};
const preventDefault = () => {};

const Events = {
  [cc_1.Input.EventType.MOUSE_DOWN]: "_dispatchMouseDownEvent",
  [cc_1.Input.EventType.MOUSE_MOVE]: "_dispatchMouseMoveEvent",
  [cc_1.Input.EventType.MOUSE_UP]: "_dispatchMouseUpEvent",
  [cc_1.Input.EventType.MOUSE_WHEEL]: "_dispatchMouseScrollEvent",
  [cc_1.Input.EventType.KEY_DOWN]: "_dispatchKeyboardDownEvent",
  [cc_1.Input.EventType.KEY_UP]: "_dispatchKeyboardUpEvent",
};

class PreviewSceneFacade extends general_scene_facade_1.default {
  _previewPlay = preview_play_1.default;
  _isEnter = false;
  init() {
    this.modeName = scene_facade_state_interface_1.SceneModeType.Preview;

    this._sceneProxy = new gameview_scene_proxy_1.default(this._sceneMgr, this);

    this._undoMgr.init();
    this.initEventListener();
    this.redirectInput();
  }
  async enter(e) {
    console.debug("enter gameview scene facade");
    this.fireCloseEvent();
    Editor.EditMode.enter(this.modeName.toLocaleLowerCase());
    this._sceneProxy.sendModeChangeMsg(this.modeName);
    e = e.sceneJson;
    await this.enterGameview(e);
    this.resetUndo();
    this._isEnter = true;
  }
  async exit() {
    console.debug("exit gameview scene facade");
    await this._previewPlay.stop();
    this._undoMgr.reset();
    this._isEnter = false;
  }
  async enterGameview(e = "") {
    await this._previewPlay.start(e);
  }
  async callPreviewPlayMethod(e, ...t) {
    return this._previewPlay[e](...t);
  }
  redirectInput() {
    if (!isSceneNative) {
      Object.keys(Events).forEach((e) => {
        this.registerOperation(e);
      });
    }
  }
  registerOperation(e) {
    const t = Events[e];
    e = e.replace("-", "");

    operation_1.default.on(
      e,
      (e) => {
        if (this.isInputRedirected()) {
          e.stopPropagation = stopPropagation;
          e.preventDefault = preventDefault;
          cc_1.input[t](e);
          return false;
        }
      },
      operation_1.OperationPriority.Preview
    );
  }
  isInputRedirected() {
    return this._isEnter && !this._previewPlay.isPause();
  }
  dispatchEvents(t, ...n) {
    this._sceneEventListener.forEach((e) => {
      if (e && e[t] && e !== cce.Prefab) {
        e[t](...n);
      }
    });
  }
  dispatchEventsOnly(t, ...n) {
    [cce.Gizmo].forEach((e) => {
      if (e && e[t]) {
        e[t](...n);
      }
    });
  }
  onSceneOpened(e) {
    this.dispatchEvents("onSceneOpened", e);
  }
  onNodeChanged(e, t) {
    if (t?.record || t?.source !== "engine") {
      this.recordNode(e);
    }

    if (t && t.type === event_enum_1.NodeOperationType.SET_PROPERTY) {
      this.dispatchEvents("onNodeChanged", e, t);
    } else {
      this.dispatchEventsOnly("onNodeChanged", e, t);
    }
  }
  onAddNode(e) {
    this.dispatchEvents("onAddNode", e);

    if (e.parent) {
      this.recordNode(e);
    }
  }
  onRemoveNode(e) {
    this.dispatchEvents("onRemoveNode", e);

    if (!e.parent) {
      this.recordNode(e);
    }
  }
  onNodeAdded(e, t = {}) {
    this.dispatchEvents("onNodeAdded", e, t);

    if (e.parent) {
      this.recordNode(e);
    }
  }
  onNodeRemoved(e, t) {
    this.dispatchEvents("onNodeRemoved", e, t);
    Editor.Selection.unselect("node", e.uuid);

    if (!e.parent) {
      this.recordNode(e);
    }
  }
  onComponentAdded(e, t = {}) {
    t.modeName = this.modeName;
    this.dispatchEvents("onComponentAdded", e, t);

    if (e instanceof cc_1.Camera) {
      setTimeout(() => {
        e.camera?.changeTargetWindow(cc.director.root.mainWindow);
      });
    }
  }
  async saveScene(e) {
    return false;
  }
}
exports.default = PreviewSceneFacade;
