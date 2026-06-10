var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (e, n, t, a = t) => {
        var i = Object.getOwnPropertyDescriptor(n, t);

        if (
          !i ||
          (!("get" in i) ? !i.writable && !i.configurable : n.__esModule)
        ) {
          i = {
            enumerable: true,
            get() {
              return n[t];
            },
          };
        }

        Object.defineProperty(e, a, i);
      }
    : (e, n, t, a) => {
        e[(a = a === undefined ? t : a)] = n[t];
      });

var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (e, n) => {
        Object.defineProperty(e, "default", { enumerable: true, value: n });
      }
    : (e, n) => {
        e.default = n;
      });

var __importStar =
  (this && this.__importStar) ||
  (() => {
    var i = (e) =>
      (i =
        Object.getOwnPropertyNames ||
        ((e) => {
          var n;
          var t = [];
          for (n in e) {
            if (Object.prototype.hasOwnProperty.call(e, n)) {
              t[t.length] = n;
            }
          }
          return t;
        }))(e);
    return (e) => {
      if (e && e.__esModule) {
        return e;
      }
      var n = {};
      if (e != null) {
        for (var t = i(e), a = 0; a < t.length; a++) {
          if (t[a] !== "default") {
            __createBinding(n, e, t[a]);
          }
        }
      }
      __setModuleDefault(n, e);
      return n;
    };
  })();

Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.listeners = undefined;
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;

exports.ready = ready;
exports.beforeClose = beforeClose;
exports.close = close;

const { readFileSync } = require("fs");

const { join } = require("path");

const { init, apply } = require("./message");

const infobarPlugin = __importStar(require("../engine-view/plugin/infobar"));
const toolbarPlugin = __importStar(require("../engine-view/plugin/toolbar"));

const {
  nativeToolbarAdapter,
  webviewToolbarAdapter,
} = require("../engine-view/plugin/toolbar/service");

const base_client_1 = require("../engine-view/views/base-client");
const panel_constant_1 = require("./panel-constant");
const panel_manager_1 = require("./panel-manager");
let panel = null;
let isNative;
function addSceneCSSVariable() {
  var e;
  var n;

  if (panel) {
    ({ width: e, height: n } = panel.$.content.getBoundingClientRect());
    panel.$.content.style.setProperty("--scene-width", e + "px");
    panel.$.content.style.setProperty("--scene-height", n + "px");
  }
}
function notifyScenePanelChange() {
  if (panel && this.ready === true) {
    exports.methods["editor-preview-change-style"]();
    addSceneCSSVariable();
    panel_manager_1.ScenePanelManager.resize(panel_constant_1.PanelName.Scene);
  }
}
function attach(e) {
  if (!e.invalid && e.info.contributions && e.info.contributions.scene) {
    var n;
    var t = e.info.contributions.scene;
    try {
      if (
        t.custom &&
        ((n = Editor.Module.__protected__.requireFile(join(e.path, t.custom)))
          .floatWindows &&
          panel.$.scene.attachFloatWindow(e.name, n.floatWindows),
        n.toolbars && panel.$.scene.attachToolbar(e.name, n.toolbars),
        n.infobars)
      ) {
        panel.$.scene.attachInfobar(e.name, n.infobars);
      }
    } catch (e) {
      console.log(e);
    }
  }
}
function detach(e) {
  panel.$.scene.detachFloatWindow(e.name);
  panel.$.scene.detachToolbar(e.name);
  panel.$.scene.detachInfobar(e.name);
}
async function updateIcon() {
  try {
    if (isNative) {
      var e = panel.$.content
        .getRootNode()
        .host.parentElement.parentElement.querySelector(
          "img[src*=scene][src*=builtin]"
        );
      if (!(e instanceof HTMLImageElement)) {
        throw new Error("scene panel icon error:img of selector is not exist");
      }
      e.onerror = console.error;

      e.src = "file://" + join(__dirname, "../../static/native-icon-2x.png");
    }
  } catch (e) {
    console.error(e);
  }
}
async function defineEngineView(e, n) {
  if (!window.customElements.get("engine-view")) {
    if (n) {
      updateIcon();

      n = (
        await Promise.resolve().then(() =>
          __importStar(require("../engine-view/views/native/engine-view"))
        )
      ).NativeEngineView;

      n = (window.customElements.define("engine-view", n),
      await Promise.resolve().then(() =>
        __importStar(require("./native/native-window-panel"))
      )).NativeWindowPanel;

      (n = new n(e, panel_constant_1.PanelName.Scene)).onPanelReady();
      e.nativeWindowPanel = n;
      window.document.body.setAttribute("mode", "native");
      panel_manager_1.ScenePanelManager.init(true);
      panel_manager_1.ScenePanelManager.scene = e;
    } else {
      n = (
        await Promise.resolve().then(() =>
          __importStar(require("../engine-view/views/web/engine-view"))
        )
      ).WebEngineView;

      window.customElements.define("engine-view", n);
    }
  }
}
async function ready() {
  panel = this;
  panel.updateIcon = updateIcon;
  isNative = await panel["query-is-native"]();
  await defineEngineView(panel, isNative);
  var e = toolbarPlugin.init(panel.$.toolbar);
  infobarPlugin.init(panel.$.infobar);
  init(panel);
  var n = panel.$.scene;

  if (isNative) {
    n.setAttribute("loading", "loading");
  }

  await n.init();

  var e = isNative ? nativeToolbarAdapter() : webviewToolbarAdapter(e);

  n.connectToGameView(e);
  Editor.Package.getPackages({ enable: true }).forEach(attach);
  Editor.Package.__protected__.on("enable", attach);
  Editor.Package.__protected__.on("disable", detach);
  await n.callSceneMethod("changeSceneViewVisible", [!panel.hidden]);

  document.addEventListener("click", () => {
    Editor.Message.broadcast("scene:toolbar-menu-active", "");
  });

  panel.ready = true;
  notifyScenePanelChange.call(panel);

  if (isNative) {
    n.removeAttribute("loading");
  }
}
async function beforeClose() {
  var e;
  var n = panel.$.scene;
  return (
    !n ||
    !!base_client_1.BaseClient.isCrash ||
    ((e = await panel.$.scene.callSceneMethod(
      "beforeClose",
      [],
      true,
      false
    )) && n.onClose(),
    await Editor.Message.request("scene", "save-scene-cache-to-file"),
    e)
  );
}
async function close() {
  this.ready = false;
  Editor.Package.__protected__.removeListener("enable", attach);
  Editor.Package.__protected__.removeListener("disable", detach);
  toolbarPlugin.close();
  panel_manager_1.ScenePanelManager.close(panel_constant_1.PanelName.Scene);
}

exports.style = readFileSync(join(__dirname, "../../dist/index.css"), "utf8");

exports.template = readFileSync(
  join(__dirname, "../../static", "/template/index.html"),
  "utf8"
);

exports.$ = {
  loading: ".loading",
  content: ".content",
  toolbar: ".toolbar",
  infobar: ".infobar",
  scene: ".scene",
  gizmos: ".gizmos",
  uiTools: ".ui-tools",
};

exports.listeners = {
  resize: notifyScenePanelChange,
  move: notifyScenePanelChange,
  show() {
    panel.$.scene.callSceneMethod("changeSceneViewVisible", [true]);

    panel_manager_1.ScenePanelManager.show(panel_constant_1.PanelName.Scene);
  },
  hide() {
    panel.$.scene.callSceneMethod("changeSceneViewVisible", [false]);

    panel_manager_1.ScenePanelManager.hide(panel_constant_1.PanelName.Scene);
  },
};

exports.methods = apply();
