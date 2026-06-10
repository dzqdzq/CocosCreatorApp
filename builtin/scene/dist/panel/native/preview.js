var __importDefault =
  (this && this.__importDefault) ||
  ((e) => (e && e.__esModule ? e : { default: e }));
Object.defineProperty(exports, "__esModule", { value: true });

exports.methods = undefined;
exports.$ = undefined;
exports.template = undefined;
exports.style = undefined;
exports.listeners = undefined;

exports.ready = ready;
exports.beforeClose = beforeClose;
exports.close = close;

const { readFileSync } = require("fs");

const { join } = require("path");

const env_1 = __importDefault(require("../../script/utils/env"));
const toolbar_1 = require("../../engine-view/plugin/toolbar");
const device_adapter_1 = require("../../script/utils/device-adapter");
const native_window_panel_1 = require("./native-window-panel");
const panel_constant_1 = require("../panel-constant");
const panel_manager_1 = require("../panel-manager");
let panel;
const isWin32 = process.platform === "win32";
function getRect() {
  var e;
  var t;
  if (panel?.$?.preview) {
    t = JSON.parse(JSON.stringify(panel.$.preview.getBoundingClientRect()));
    e = isWin32 ? window.devicePixelRatio : 1;

    toRoundRect(
      (t = {
        x: t.left * e,
        y: (isWin32 ? t.top : window.innerHeight - t.bottom) * e,
        width: t.width * e,
        height: t.height * e,
      })
    );

    return t;
  }
}
class EditorPreviewElement extends HTMLElement {
  rect = { x: 0, y: 0, width: 0, height: 0 };
  isPreviewing = false;
  constructor() {
    super();
  }
  updateBackground() {
    var e = this.parentElement.querySelector(".game-view-toolbar");
    var t = this.parentElement.getBoundingClientRect();
    var e = e.getBoundingClientRect();
    var i = isWin32 ? window.devicePixelRatio : 1;
    var a = panel.devicesInfo?.type === "free";
    var e = a ? 0 : (t.height - e.height - this.rect.height / i) / 2;
    var a = a ? 0 : (t.width - this.rect.width / i) / 2;
    this.style.borderColor = "var(--color-normal-fill)";
    this.style.borderStyle = "solid";
    this.style.borderBottomWidth = e + "px";
    this.style.borderTopWidth = e + "px";
    this.style.borderLeftWidth = a + "px";
    this.style.borderRightWidth = a + "px";
  }
  async resize(e) {
    this.rect = e || this.rect;
    toRoundRect(this.rect);
    this.updateBackground();

    panel_manager_1.ScenePanelManager.resize(
      panel_constant_1.PanelName.Preview,
      this.rect
    );
  }
}
function toRoundRect(e) {
  e.x = Math.round(e.x);
  e.y = Math.round(e.y);
  e.width = Math.round(e.width);
  e.height = Math.round(e.height);
}
function onPreviewPanelChange() {
  var e;

  if (panel && (e = getRect())) {
    device_adapter_1.NativeAdapter.reset(e?.width, e?.height);
    panel.editorPreviewChangeStyle();
  }
}
async function ready() {
  var e;

  if (await env_1.default.useNativeScene()) {
    panel = this;

    (e = new native_window_panel_1.NativeWindowPanel(
      panel,
      panel_constant_1.PanelName.Preview
    )).onPanelReady();

    panel.nativeWindowPanel = e;
    panel_manager_1.ScenePanelManager.preview = panel;

    window.customElements.get("editor-preview") ||
      window.customElements.define("editor-preview", EditorPreviewElement);

    device_adapter_1.NativeAdapter.enable = true;
    await panel.initToolbar();

    (e = getRect()) &&
      device_adapter_1.NativeAdapter.reset(e?.width, e?.height);
  } else {
    Editor.Panel.close("scene.preview");
  }
}
function beforeClose() {}
function close() {
  this.destroyToolbar();
  panel_manager_1.ScenePanelManager.close(panel_constant_1.PanelName.Preview);
}

exports.listeners = {
  async show() {
    panel_manager_1.ScenePanelManager.show(panel_constant_1.PanelName.Preview);
  },
  hide() {
    panel_manager_1.ScenePanelManager.hide(panel_constant_1.PanelName.Preview);
  },
  resize: onPreviewPanelChange,
  move: onPreviewPanelChange,
};

exports.style = readFileSync(
  join(__dirname, "../../../dist/preview.css"),
  "utf-8"
);

exports.template = readFileSync(
  join(__dirname, "../../../static/template/preview.html"),
  "utf-8"
);

exports.$ = {
  toolbar: ".toolbar > template",
  preview: ".preview",
  content: ".preview",
};

exports.methods = {
  async initToolbar() {
    var e;

    if (await Editor.Message.request("scene", "is-native")) {
      e = new toolbar_1.ToolbarGameView({
        propsData: { isNative: true, visible: true },
      }).$mount(this.$.toolbar);

      this._toolbarVm = e;
    } else {
      this.destroyToolbar();
    }
  },
  destroyToolbar() {
    if (this._toolbarVm) {
      this._toolbarVm?.$destroy();
      this._toolbarVm = undefined;
    }
  },
  async getGameViewData() {
    if (this._toolbarVm) {
      return { ...this._toolbarVm.gameViewData };
    }
    throw new Error("preview toolbar is not initialized yet or it's disabled");
  },
  async editorPreviewChangeStyle() {
    if (panel && panel._toolbarVm) {
      var { rotate, scaleValue, devicesInfo, fullScreen } =
        panel._toolbarVm.gameViewData;

      let { width, height } = devicesInfo;

      switch (devicesInfo.type) {
        case "ratio":
          o = device_adapter_1.NativeAdapter.ratioToSize(width, height);
          width = o.width * window.devicePixelRatio;
          height = o.height * window.devicePixelRatio;
          break;
        case "design":
          o = await Editor.Profile.getProject(
            "project",
            "general.designResolution"
          );

          width = o.width;
          height = o.height;

          break;
        case "free":
          width =
            device_adapter_1.NativeAdapter.screenWidth *
            window.devicePixelRatio;

          height =
            device_adapter_1.NativeAdapter.screenHeight *
            window.devicePixelRatio;

          break;
      }

      device_adapter_1.NativeAdapter.fitScreen(
        width,
        height,
        fullScreen,
        rotate,
        scaleValue / 100
      );
      var o = getRect();

      if (o) {
        o.x += device_adapter_1.NativeAdapter.offsetX;
        o.y += device_adapter_1.NativeAdapter.offsetY;
        o.width = device_adapter_1.NativeAdapter.width;
        o.height = device_adapter_1.NativeAdapter.height;
      }

      panel.devicesInfo = devicesInfo;
      panel.$.preview.resize(o);
      return { scale: Math.floor(100 * device_adapter_1.NativeAdapter.scale) };
    }
  },
  async editorPreviewChangeConfig() {
    panel;
  },
  onEditorPreviewStop() {
    panel_manager_1.ScenePanelManager.onPreviewStop();
  },
};
