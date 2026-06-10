var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, t, a, n = a) => {
        var i = Object.getOwnPropertyDescriptor(t, a);

        if (
          !i ||
          (!("get" in i) ? !i.writable && !i.configurable : t.__esModule)
        ) {
          i = {
            enumerable: true,
            get() {
              return t[a];
            },
          };
        }

        Object.defineProperty(e, n, i);
      }
    : (e, t, a, n) => {
        e[(n = n === undefined ? a : n)] = t[a];
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
    var i = (e) =>
      (i =
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
        for (var a = i(e), n = 0; n < a.length; n++) {
          if (a[n] !== "default") {
            __createBinding(t, e, a[n]);
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
exports.BaseView = undefined;
const vDependence = require("v-dependence");
const float_window_1 = __importDefault(require("../plugin/float-window"));
const tasks_1 = __importDefault(require("../tasks"));
const toolbar = __importStar(require("../plugin/toolbar"));
const toolbar_1 = require("../plugin/toolbar");
const infobar_1 = __importDefault(require("../plugin/infobar"));

const { init, release } = require("../listener");

const { debounce } = require("lodash");

class BaseView extends HTMLElement {
  dirty = false;
  managerReady = false;
  isPreviewEnabled = false;
  $scene;
  previewClient;
  depend = vDependence.create();
  $floatWindow = float_window_1.default.get();
  ipc;
  info;
  isSceneManagerReady = false;
  sceneMessageBuffer = [];
  _gameViewService = toolbar_1.NullGameViewService;
  __plugin_info__ = null;
  _updatePluginDebounce = null;
  constructor() {
    super();
    (tasks_1.default.$scene = this).setAttribute("tabindex", "-1");
    this.depend.add(...tasks_1.default.editorInit);
    this.depend.add(...tasks_1.default.assetDbReady);
    this.depend.add(...tasks_1.default.queryEngineInfo);
    this.depend.add(...tasks_1.default.webviewReady);
    this.depend.add(...tasks_1.default.webviewEngineInit);
    this.depend.add(...tasks_1.default.webviewManagerInit);
    this.depend.add(...tasks_1.default.packerDriverReady);
    this.depend.add(...tasks_1.default.autoOpenScene);
    this.appendChild(this.$floatWindow);

    this._updatePluginDebounce = debounce(
      (() => {
        var e = this.__plugin_info__;
        if (e) {
          const t = {};
          const a = [];

          e.nodes.forEach((e) => {
            e.components.forEach((e) => {
              if (!a.includes(e.type)) {
                a.push(e.type);
              }

              (t[e.type] = t[e.type] || []).push(e);
            });
          });

          if (e.nodes.length > 0) {
            float_window_1.default.select(e, a, t);
          } else {
            float_window_1.default.unselect();
          }

          toolbar.update(e, a, t);
          infobar_1.default.update(e, a, t);
        }
      }).bind(this),
      150
    );
  }
  async init() {
    this.$scene.webview.addEventListener("destroyed", () => {
      this.depend.reset(tasks_1.default.webviewReady[0]);
    });

    await init(this);
  }
  async callSceneMethod(i, r = [], d = false, s = true) {
    if (!d) {
      tasks_1.default.updateDump();
    }

    return new Promise((a, n) => {
      function t(e, t) {
        if (e) {
          n(e);
        } else {
          a(t);
        }
      }
      var e;
      if (!this.isSceneManagerReady) {
        e = {
          module: "SceneFacadeManager",
          handler: i,
          params: r,
          queue: !d,
          timeout: s,
          callback: t,
        };

        return this.sceneMessageBuffer.push(e);
      }
      this.ipc
        .send("call-method", {
          module: "SceneFacadeManager",
          handler: i,
          params: r,
          queue: !d,
          timeout: s,
        })
        .then((e) => {
          t(null, e);
        })
        .catch((e) => {
          t(e, null);
        });
    });
  }
  setSceneManagerReady(e) {
    this.isSceneManagerReady = e;

    if (this.isSceneManagerReady) {
      this.sceneMessageBuffer.forEach((t) => {
        this.ipc
          .send("call-method", {
            module: t.module,
            handler: t.handler,
            params: t.params,
            queue: t.queue,
            timeout: t.timeout,
          })
          .then((e) => {
            t.callback(null, e);
          });
      });
    }
  }
  async executeComponentMethod(e) {
    this.dirty = true;

    return this.ipc.send("call-method", {
      module: "Scene",
      handler: "executeComponentMethod",
      params: [e.uuid, e.index, ...(e.methodNames || [])],
      queue: true,
      timeout: true,
    });
  }
  updatePlugin(e) {
    this.__plugin_info__ = e;
    this._updatePluginDebounce?.();
  }
  attachFloatWindow(e, t) {
    float_window_1.default.register(e, t);
  }
  detachFloatWindow(e) {
    float_window_1.default.unregister(e);
  }
  connectToGameView(e) {
    this._gameViewService = e;
  }
  attachToolbar(e, t) {
    toolbar.register(e, t);
  }
  detachToolbar(e) {
    toolbar.unregister(e);
  }
  attachInfobar(e, t) {
    infobar_1.default.register(e, t);
  }
  detachInfobar(e) {
    infobar_1.default.unregister(e);
  }
  onClose() {
    release();
  }
  onCloseScene(e) {
    this._gameViewService.onCloseScene(e);
  }
  onUpdateScene(e) {
    this._gameViewService.onUpdateScene(e);
  }
  onSceneFocus(e) {
    this._gameViewService.onSceneFocus(e);
  }
  onUpdateSceneDirty(e, t) {
    this._gameViewService.onUpdateSceneDirty(e, t);
  }
}
exports.BaseView = BaseView;
